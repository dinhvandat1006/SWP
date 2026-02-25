import prisma from "../lib/prisma.js";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

// Get all categories with course counts
export const getCategories = async () => {
  try {
    const cacheKey = "categories_all";
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) return cachedResult;

    const categories = await prisma.categories.findMany({
      where: {
        IsLeaf: true, // Only leaf categories that have courses
      },
      select: {
        Id: true,
        Title: true,
        Description: true,
        CourseCount: true,
        Path: true,
      },
      orderBy: {
        Title: "asc",
      },
    });

    cache.set(cacheKey, categories);
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

// Get courses with optional filters
export const getCourses = async (filters = {}) => {
  try {
    const {
      categoryId,
      level,
      minPrice,
      maxPrice,
      search,
      page = 1,
      limit = 12, // Reduced from 24 to 12 for faster loading
      sortBy = "newest",
    } = filters;

    // Create a unique cache key based on filters
    const cacheKey = `courses_${JSON.stringify(filters)}`;
    const cachedResult = cache.get(cacheKey);

    if (cachedResult) {
      console.log("Serving courses from cache");
      return cachedResult;
    }

    // Build where clause - Match actual database values
    const where = {
      ApprovalStatus: "APPROVED", // Match database: 'APPROVED' (uppercase)
      Status: "Ongoing", // Match database: 'Ongoing' (most courses have this status)
    };

    if (categoryId && categoryId !== "all") {
      where.LeafCategoryId = categoryId;
    }

    if (level && level !== "all") {
      where.Level = level;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.Price = {};
      if (minPrice !== undefined) {
        where.Price.gte = parseFloat(minPrice);
      }
      if (maxPrice !== undefined) {
        where.Price.lte = parseFloat(maxPrice);
      }
    }

    if (search) {
      where.OR = [
        { Title: { contains: search, mode: "insensitive" } },
        { Description: { contains: search, mode: "insensitive" } },
        { Intro: { contains: search, mode: "insensitive" } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch courses with selective fields for performance
    console.time("DB_QUERY_TIME");
    const [courses, totalCount] = await Promise.all([
      prisma.courses.findMany({
        where,
        skip,
        take: limit,
        select: {
          Id: true,
          Title: true,
          Intro: true,
          Description: true,
          ThumbUrl: true,
          Price: true,
          Discount: true,
          Level: true,
          RatingCount: true,
          TotalRating: true,
          LectureCount: true,
          LearnerCount: true,
          CreationTime: true,
          Categories: {
            select: {
              Id: true,
              Title: true,
            },
          },
          Instructors: {
            select: {
              Users_Instructors_CreatorIdToUsers: {
                select: {
                  FullName: true,
                  AvatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: (function () {
          switch (sortBy) {
            case "price_asc":
              return { Price: "asc" };
            case "price_desc":
              return { Price: "desc" };
            case "popular":
              return { LearnerCount: "desc" };
            case "rating":
              return { TotalRating: "desc" };
            case "newest":
            default:
              return { CreationTime: "desc" };
          }
        })(),
      }),
      prisma.courses.count({ where }),
    ]);
    console.timeEnd("DB_QUERY_TIME");

    // Transform data to match frontend expectations
    const transformedCourses = courses.map((course) => {
      const avgRating =
        course.RatingCount > 0
          ? (Number(course.TotalRating) / course.RatingCount).toFixed(1)
          : 0;

      const instructor = course.Instructors.Users_Instructors_CreatorIdToUsers;

      return {
        id: course.Id,
        title: course.Title,
        description: course.Intro || course.Description,
        image:
          course.ThumbUrl ||
          "https://via.placeholder.com/400x225?text=Course+Image",
        category: course.Categories.Title,
        categoryId: course.Categories.Id,
        rating: parseFloat(avgRating),
        reviews: course.RatingCount,
        duration: `${course.LectureCount || 0} lectures`,
        level: course.Level,
        price: parseFloat(course.Price).toFixed(2),
        discount:
          course.Discount > 0 ? parseFloat(course.Discount).toFixed(2) : null,
        instructorName: instructor.FullName,
        instructorImg:
          instructor.AvatarUrl ||
          "https://via.placeholder.com/100?text=Instructor",
        learnerCount: course.LearnerCount,
        createdAt: course.CreationTime,
      };
    });

    const result = {
      courses: transformedCourses,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error fetching courses:", error);
    throw error;
  }
};

// Get single course by ID
export const getCourseById = async (courseId) => {
  try {
    console.log("[courseService] Fetching course:", courseId);

    const cacheKey = `course_${courseId}`;
    const cachedResult = cache.get(cacheKey);

    if (cachedResult) {
      console.log("[courseService] Serving course from cache:", courseId);
      return cachedResult;
    }

    const course = await prisma.courses.findFirst({
      where: {
        Id: courseId,
        ApprovalStatus: "APPROVED", // Match actual DB value
        Status: "Ongoing", // Match actual DB value
      },
      select: {
        // Core fields
        Id: true,
        Title: true,
        Intro: true,
        Description: true,
        ThumbUrl: true,
        Price: true,
        Discount: true,
        Level: true,
        Status: true,

        // Stats
        RatingCount: true,
        TotalRating: true,
        LectureCount: true,
        LearnerCount: true,

        // Timestamps
        CreationTime: true,

        // Relations with selective fields
        Categories: {
          select: {
            Id: true,
            Title: true,
            Description: true,
          },
        },
        Instructors: {
          select: {
            Id: true,
            CreatorId: true,
            Users_Instructors_CreatorIdToUsers: {
              select: {
                Id: true,
                FullName: true,
                AvatarUrl: true,
              },
            },
          },
        },
        Sections: {
          select: {
            Id: true,
            Title: true,
            CreationTime: true,
            // Only fetch lecture count, not full lecture content
            Lectures: {
              select: {
                Id: true,
                Title: true,
              },
            },
          },
          orderBy: {
            CreationTime: "asc",
          },
        },
      },
    });

    console.log("[courseService] Course found:", course ? "Yes" : "No");

    if (!course) {
      throw new Error("Course not found");
    }

    cache.set(cacheKey, course);
    return course;
  } catch (error) {
    console.error("[courseService] Error fetching course:", error);
    throw error;
  }
};

// Get instructor's courses
export const getInstructorCourses = async (instructorId, filters = {}) => {
  try {
    const { status = "all", page = 1, limit = 10 } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = { InstructorId: instructorId };
    if (status !== "all") {
      // Map frontend status to database Status
      const statusMap = {
        'published': 'Ongoing',
        'draft': 'Draft',
        'archived': 'Archived'
      };
      where.Status = statusMap[status] || status;
    }

    // Get total count
    const total = await prisma.courses.count({ where });

    // Get courses
    const courses = await prisma.courses.findMany({
      where,
      select: {
        Id: true,
        Title: true,
        Intro: true,
        Description: true,
        Price: true,
        Discount: true,
        Status: true,
        ThumbUrl: true,
        TotalRating: true,
        RatingCount: true,
        LearnerCount: true,
        Sections: {
          select: {
            Lectures: {
              select: { Id: true },
            },
          },
        },
      },
      orderBy: { CreationTime: "desc" },
      skip,
      take: limit,
    });

    // Calculate lecture count and transform data
    const coursesWithLectureCount = courses.map((course) => ({
      id: course.Id,
      title: course.Title,
      shortDescription: course.Intro,
      description: course.Description,
      price: course.Price,
      discountPrice: course.Discount,
      status: course.Status,
      thumbnailUrl: course.ThumbUrl,
      rating: course.RatingCount > 0 ? Number(course.TotalRating) / course.RatingCount : 0,
      reviewCount: course.RatingCount,
      studentCount: course.LearnerCount,
      lectureCount: course.Sections.reduce(
        (acc, section) => acc + section.Lectures.length,
        0,
      ),
    }));

    return {
      data: coursesWithLectureCount,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("[courseService] Error fetching instructor courses:", error);
    throw error;
  }
};

// Get instructor stats
export const getInstructorStats = async (instructorId) => {
  try {
    // Get instructor data
    const instructor = await prisma.instructors.findUnique({
      where: { Id: instructorId },
      select: {
        Id: true,
        Intro: true,
        Courses: {
          select: {
            Id: true,
            Status: true,
            LearnerCount: true,
            Price: true,
            Discount: true,
            Sections: {
              select: {
                Lectures: {
                  select: { Id: true },
                },
              },
            },
          },
        },
      },
    });

    if (!instructor) {
      return null;
    }

    // Calculate stats
    const totalCourses = instructor.Courses.length;
    const publishedCourses = instructor.Courses.filter(
      (c) => c.Status === "Ongoing",
    ).length;
    const totalStudents = instructor.Courses.reduce(
      (sum, c) => sum + (c.LearnerCount || 0),
      0,
    );
    const totalLectures = instructor.Courses.reduce(
      (sum, c) =>
        sum +
        c.Sections.reduce(
          (sectionSum, section) => sectionSum + section.Lectures.length,
          0,
        ),
      0,
    );

    // Calculate revenue (simplified - just price * student count)
    const totalRevenue = instructor.Courses.reduce((sum, course) => {
      const price = course.Discount > 0 ? course.Discount : course.Price || 0;
      return sum + price * (course.LearnerCount || 0);
    }, 0);

    return {
      totalCourses,
      publishedCourses,
      totalStudents,
      totalLectures,
      totalRevenue: totalRevenue.toFixed(2),
    };
  } catch (error) {
    console.error("[courseService] Error fetching instructor stats:", error);
    throw error;
  }
};

// Create new course
export const createCourse = async (courseData) => {
  try {
    const {
      title,
      description,
      price,
      level,
      instructorId,
      sections = [],
    } = courseData;

    console.log("[courseService] Creating course:", {
      title,
      instructorId,
      sectionCount: sections.length,
    });

    // Check if instructor exists, if not create one
    // Use findFirst instead of findUnique because CreatorId is not a unique field
    let instructor = await prisma.instructors.findFirst({
      where: { CreatorId: instructorId },
    });

    if (!instructor) {
      console.log(
        "[courseService] Creating instructor for user:",
        instructorId,
      );
      instructor = await prisma.instructors.create({
        data: {
          CreatorId: instructorId,
        },
      });
    }

    // Get default category
    const defaultCategory = await prisma.categories.findFirst({
      where: {
        IsLeaf: true,
      },
    });

    if (!defaultCategory) {
      throw new Error(
        "No default category found. Please set up categories first.",
      );
    }

    // Create course with sections
    const newCourse = await prisma.courses.create({
      data: {
        Title: title,
        MetaTitle: title,
        Description: description || "",
        Price: parseFloat(price) || 0,
        Level: level || "Beginner",
        LeafCategoryId: defaultCategory.Id,
        InstructorId: instructor.Id,
        CreatorId: instructorId,
        LastModifierId: instructorId,
        Status: "Draft",
        Sections: {
          create: sections.map((section, sectionIndex) => ({
            Title: section.title || `Section ${sectionIndex + 1}`,
            Index: sectionIndex,
            Lectures: {
              create: (section.lectures || []).map((lecture, lectureIndex) => ({
                Title: lecture.title || `Lecture ${lectureIndex + 1}`,
                Content: lecture.description || "",
              })),
            },
          })),
        },
      },
      include: {
        Sections: {
          include: {
            Lectures: true,
          },
        },
      },
    });

    console.log("[courseService] Course created successfully:", newCourse.Id);
    return newCourse;
  } catch (error) {
    console.error("[courseService] Error creating course:", error);
    throw error;
  }
};
