import * as courseService from "../services/courseService.js";
import * as reviewService from "../services/reviewService.js";
import prisma from "../lib/prisma.js";

// Add Review
export const addReview = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const { rating, content } = req.body;
    const userId = req.user.userId; // From authMiddleware

    console.log(
      `[CourseController] addReview Request - User: ${userId}, Course: ${courseId}, Body:`,
      req.body,
    );

    const review = await reviewService.createReview(userId, courseId, {
      rating,
      content,
    });

    // Serialize BigInt if any (though review mostly uses Int/String)
    const serializedReview = JSON.parse(
      JSON.stringify(review, (key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    );

    res.status(201).json({
      success: true,
      data: serializedReview,
    });
  } catch (error) {
    console.error("Add review error:", error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Get Reviews
export const getReviews = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const { page, limit } = req.query;

    const result = await reviewService.getCourseReviews(
      courseId,
      parseInt(page) || 1,
      parseInt(limit) || 10,
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch reviews",
    });
  }
};

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await courseService.getCategories();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch categories",
      message: error.message,
    });
  }
};

// Get courses with filters
export const getCourses = async (req, res) => {
  try {
    const {
      categoryId,
      level,
      minPrice,
      maxPrice,
      search,
      page,
      limit,
      sortBy,
    } = req.query;

    const filters = {
      categoryId,
      level,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 24,
      sortBy,
    };

    const result = await courseService.getCourses(filters);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch courses",
      message: error.message,
    });
  }
};

// Get single course by ID
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await courseService.getCourseById(id);

    // Convert BigInt to string for JSON serialization
    const serializedCourse = JSON.parse(
      JSON.stringify(course, (key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    );

    res.json({
      success: true,
      data: serializedCourse,
    });
  } catch (error) {
    console.error("Get course error:", error);
    if (error.message === "Course not found") {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to fetch course",
      message: error.message,
    });
  }
};

// Get instructor's courses
export const getInstructorCourses = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Find instructor by CreatorId (userId)
    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: userId }
    });
    
    if (!instructor) {
      return res.status(200).json({
        success: true,
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        pages: 0
      });
    }

    const { status = "all", page = 1, limit = 10 } = req.query;
    const result = await courseService.getInstructorCourses(instructor.Id, {
      status,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get instructor courses error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get instructor stats
export const getInstructorStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Find instructor by CreatorId (userId)
    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: userId }
    });
    
    if (!instructor) {
      return res.status(200).json({
        success: true,
        data: {
          totalCourses: 0,
          publishedCourses: 0,
          totalStudents: 0,
          totalLectures: 0,
          totalRevenue: "0.00"
        }
      });
    }

    const stats = await courseService.getInstructorStats(instructor.Id);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get instructor stats error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Create Course
export const createCourse = async (req, res) => {
  try {
    const instructorId = req.user.userId;
    const { title, description, price, level, sections } = req.body;

    console.log(
      `[CourseController] createCourse - Instructor: ${instructorId}, Title: ${title}`,
    );

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: "Course title is required",
      });
    }

    if (!sections || sections.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one section is required",
      });
    }

    const courseData = {
      title: title.trim(),
      description: description || "",
      price: parseFloat(price) || 0,
      level: level || "Beginner",
      instructorId,
      sections: sections || [],
    };

    const course = await courseService.createCourse(courseData);

    // Convert BigInt to string for JSON serialization
    const serializedCourse = JSON.parse(
      JSON.stringify(course, (key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    );

    res.status(201).json({
      success: true,
      data: serializedCourse,
      message: "Course created successfully",
    });
  } catch (error) {
    console.error("Create course error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create course",
    });
  }
};
