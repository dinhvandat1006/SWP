import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAuth from "../hooks/useAuth";
import {
  fetchCourseLessons,
  fetchEnrollmentProgress,
} from "../services/lessonService";

// Mock data for demonstration
const MOCK_COURSE = {
  Id: "course-001",
  Title: "Advanced JavaScript Mastery",
  Sections: [
    {
      Id: "section-001",
      Title: "Section 1: Fundamentals",
      Index: 0,
      Lectures: [
        { Id: "lecture-001", Title: "What is JavaScript?" },
        { Id: "lecture-002", Title: "Setup Your Environment" },
        { Id: "lecture-003", Title: "Variables & Data Types" },
      ],
    },
    {
      Id: "section-002",
      Title: "Section 2: Functions",
      Index: 1,
      Lectures: [
        { Id: "lecture-004", Title: "Function Basics" },
        { Id: "lecture-005", Title: "Arrow Functions" },
        { Id: "lecture-006", Title: "Closures & Scope" },
      ],
    },
    {
      Id: "section-003",
      Title: "Section 3: Async Programming",
      Index: 2,
      Lectures: [
        { Id: "lecture-007", Title: "Promises" },
        { Id: "lecture-008", Title: "Async/Await" },
        { Id: "lecture-009", Title: "Error Handling" },
      ],
    },
  ],
  LectureCount: 9,
};

const MOCK_ENROLLMENT = {
  LectureMilestones: JSON.stringify(["lecture-001", "lecture-002"]),
};

const MOCK_CURRENT_LESSON = {
  Id: "lecture-003",
  Title: "Variables & Data Types",
  Content: `In this comprehensive lesson, you'll learn about JavaScript variables and the various data types available. We'll cover:
  
  • var, let, and const declarations
  • The differences between these declarations
  • Primitive data types (string, number, boolean, null, undefined, symbol)
  • Reference data types (objects, arrays)
  • Type coercion and comparison
  • Best practices for variable naming
  
  By the end of this lesson, you'll have a solid understanding of how to properly declare and use variables in your JavaScript applications.`,
};

export default function CourseLessonPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedLessonId, setSelectedLessonId] = useState(
    lessonId || "lecture-003",
  );

  // Fetch course data
  const {
    data: courseResponse,
    isLoading: courseLoading,
    error: courseError,
  } = useQuery({
    queryKey: ["courseLessons", courseId],
    queryFn: () => fetchCourseLessons(courseId),
    enabled: !!courseId && courseId !== "demo",
  });

  // Fetch enrollment progress
  const { data: enrollmentData } = useQuery({
    queryKey: ["enrollmentProgress", courseId, user?.id],
    queryFn: () => fetchEnrollmentProgress(user?.id, courseId),
    enabled: !!courseId && !!user?.id && courseId !== "demo",
  });

  // Use mock data if in demo mode or if no real data
  const course =
    courseId === "demo" ? MOCK_COURSE : courseResponse?.data || courseResponse;
  const enrollment = courseId === "demo" ? MOCK_ENROLLMENT : enrollmentData;
  const currentLessonId = selectedLessonId || lessonId;

  // Debug logging
  useEffect(() => {
    console.log("[CourseLessonPage] Course data:", course);
    console.log("[CourseLessonPage] Enrollment data:", enrollment);
    console.log("[CourseLessonPage] courseId:", courseId);
    console.log("[CourseLessonPage] user:", user);
  }, [course, enrollment, courseId, user]);

  // Find the current lesson from sections
  const findLessonInSections = (sections, lectureId) => {
    for (const section of sections || []) {
      const lecture = section.Lectures?.find((l) => l.Id === lectureId);
      if (lecture) return { ...lecture, ...MOCK_CURRENT_LESSON };
    }
    return MOCK_CURRENT_LESSON;
  };

  // Get the first lecture if no specific lecture is selected
  useEffect(() => {
    if (!lessonId && course?.Sections && course.Sections.length > 0) {
      const firstLecture = course.Sections[0]?.Lectures?.[0];
      if (firstLecture?.Id) {
        setSelectedLessonId(firstLecture.Id);
      }
    }
  }, [course?.Sections, lessonId]);

  const currentLesson = findLessonInSections(course?.Sections, currentLessonId);

  // Calculate progress
  const calculateProgress = () => {
    if (!enrollment) return 0;
    const completedLectures = JSON.parse(
      enrollment.LectureMilestones || "[]",
    ).length;
    const totalLectures = course?.LectureCount || 1;
    return Math.round((completedLectures / totalLectures) * 100);
  };

  // Transform sections for the sidebar
  const transformSections = (sections, enrollment) => {
    if (!sections) return [];
    const completedLectures =
      JSON.parse(enrollment?.LectureMilestones || "[]") || [];

    return sections.map((section) => ({
      title: `Section ${section.Index}: ${section.Title}`,
      status: section.Lectures?.every((l) => completedLectures.includes(l.Id))
        ? "completed"
        : section.Lectures?.some((l) => completedLectures.includes(l.Id))
          ? "in-progress"
          : section.Index > 1
            ? "locked"
            : "in-progress",
      items:
        section.Lectures?.map((lecture) => ({
          id: lecture.Id,
          title: lecture.Title,
          status: completedLectures.includes(lecture.Id)
            ? "completed"
            : lecture.Id === currentLessonId
              ? "active"
              : section.Index > 1
                ? "locked"
                : "pending",
          duration: `${Math.ceil(Math.random() * 20)} min`,
          type: "Video",
        })) || [],
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return "check_circle";
      case "active":
        return "play_circle";
      case "locked":
        return "lock";
      case "pending":
        return "radio_button_unchecked";
      default:
        return "radio_button_unchecked";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-500";
      case "active":
        return "text-primary animate-pulse";
      case "locked":
        return "text-slate-500";
      case "pending":
        return "text-slate-400";
      default:
        return "text-slate-400";
    }
  };

  const getSectionBorderColor = (status) => {
    switch (status) {
      case "in-progress":
        return "border-primary/30 text-primary";
      case "completed":
        return "border-slate-800 text-slate-400";
      case "locked":
        return "border-slate-800 text-slate-500";
      default:
        return "border-slate-800 text-slate-400";
    }
  };

  // Loading state
  if (courseLoading) {
    return (
      <div className="flex h-screen w-full bg-background-light dark:bg-background-dark items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white">Loading course...</p>
        </div>
      </div>
    );
  }

  if (courseError) {
    return (
      <div className="flex h-screen w-full bg-background-light dark:bg-background-dark items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-8 bg-slate-900/50 rounded-lg border border-red-500/20 max-w-md">
          <span className="material-symbols-outlined text-4xl text-red-500">
            error
          </span>
          <p className="text-white font-bold">Failed to load course</p>
          <p className="text-slate-400 text-sm text-center">
            {courseError.message}
          </p>
          <div className="text-xs text-slate-500 max-h-24 overflow-auto bg-slate-950 p-2 rounded w-full">
            <pre>
              {JSON.stringify({ courseId, error: courseError }, null, 2)}
            </pre>
          </div>
          <button
            onClick={() => navigate("/my-learning")}
            className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-purple-600"
          >
            Back to My Learning
          </button>
        </div>
      </div>
    );
  }

  const sections = transformSections(course?.Sections, enrollment);
  const progress = calculateProgress();

  // Debug: Log render state
  console.log("[CourseLessonPage] Render state:", {
    courseLoading,
    courseError,
    course: course?.Title,
    sections: sections?.length,
    courseId,
  });

  // Check if course has no sections
  if (
    !courseLoading &&
    course &&
    (!course.Sections || course.Sections.length === 0)
  ) {
    return (
      <div className="flex h-screen w-full bg-background-light dark:bg-background-dark items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-8 bg-slate-900/50 rounded-lg border border-amber-500/20 max-w-md">
          <span className="material-symbols-outlined text-4xl text-amber-500">
            info
          </span>
          <p className="text-white font-bold">No lessons yet</p>
          <p className="text-slate-400 text-sm text-center">
            This course doesn't have any sections or lessons yet.
          </p>
          <button
            onClick={() => navigate("/my-learning")}
            className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-purple-600"
          >
            Back to My Learning
          </button>
        </div>
      </div>
    );
  }

  // Debug: Check if currentLesson exists
  console.log("[CourseLessonPage] currentLesson:", currentLesson);
  console.log(
    "[CourseLessonPage] courseId:",
    courseId,
    "lessonId:",
    lessonId,
    "selectedLessonId:",
    selectedLessonId,
    "currentLessonId:",
    currentLessonId,
  );

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark">
      {/* Left Sidebar */}
      <aside className="w-[340px] flex-shrink-0 flex flex-col glass-panel border-r border-glass-border h-full relative z-20">
        {/* Header Area */}
        <div className="p-6 border-b border-glass-border bg-[#130d1a]/50">
          <div className="flex items-center gap-2 mb-6">
            <div className="size-6 text-primary">
              <svg
                fill="none"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_6_319)">
                  <path
                    d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z"
                    fill="currentColor"
                  ></path>
                </g>
              </svg>
            </div>
            <h2 className="text-white text-lg font-bold tracking-tight">
              FlyUp
            </h2>
          </div>
          <h3 className="text-white text-xl font-bold leading-tight mb-3">
            {course?.Title || "Loading..."}
          </h3>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <span className="text-sm font-medium text-slate-300">
                Course Progress
              </span>
              <span className="text-sm font-bold text-primary">
                {progress}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary shadow-[0_0_10px_rgba(168,85,247,0.5)] rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Scrollable Course Tree */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="group">
              <div
                className={`flex items-center gap-3 px-2 py-2 mb-1 text-xs font-semibold uppercase tracking-wider ${getSectionBorderColor(section.status)}`}
              >
                {section.title}
              </div>
              <div
                className={`flex flex-col gap-1 relative pl-3 border-l ml-3 ${getSectionBorderColor(section.status)}`}
              >
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    className={`relative flex items-center gap-3 w-full p-2.5 rounded-lg text-left transition-all ${
                      item.status === "active"
                        ? "bg-primary/10 border border-primary/20 shadow-inner"
                        : item.status === "locked"
                          ? "cursor-not-allowed opacity-50"
                          : "hover:bg-white/5"
                    }`}
                    onClick={() => {
                      if (item.status !== "locked") {
                        setSelectedLessonId(item.id);
                      }
                    }}
                  >
                    <div
                      className={`absolute -left-[19px] top-1/2 -translate-y-1/2 size-2.5 rounded-full ${
                        item.status === "completed"
                          ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                          : item.status === "active"
                            ? "bg-primary shadow-[0_0_12px_rgba(168,85,247,1)] ring-2 ring-[#0a0a14] size-3"
                            : "bg-slate-700"
                      }`}
                    ></div>

                    <span
                      className={`material-symbols-outlined text-[20px] ${getStatusColor(item.status)}`}
                    >
                      {getStatusIcon(item.status)}
                    </span>

                    <div
                      className={
                        item.status === "active" ? "flex flex-col" : ""
                      }
                    >
                      <span
                        className={`text-sm ${
                          item.status === "active"
                            ? "font-medium text-white"
                            : item.status === "completed"
                              ? "text-slate-300 line-through decoration-slate-600"
                              : "text-slate-300 group-hover:text-white"
                        }`}
                      >
                        {item.title}
                      </span>
                      {item.status === "active" && (
                        <span className="text-[10px] text-primary/80">
                          {item.duration} • {item.type}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-glass-border bg-[#130d1a]/50">
          <div className="flex items-center gap-3">
            {user?.Avatar && (
              <div
                className="size-9 rounded-full bg-center bg-cover border border-glass-border"
                style={{ backgroundImage: `url('${user.Avatar}')` }}
              ></div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">
                {user?.FullName || "Student"}
              </span>
              <span className="text-xs text-slate-400">Learner</span>
            </div>
            <button className="ml-auto text-slate-400 hover:text-white transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar relative z-10">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2072&auto=format&fit=crop")',
          }}
        ></div>

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-[#0a0a14]/90 z-0"></div>

        <div className="relative z-10 container mx-auto max-w-5xl px-8 py-8 flex flex-col gap-8">
          {/* Breadcrumbs & Nav */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <a
                href="/my-learning"
                className="hover:text-primary transition-colors"
              >
                Courses
              </a>
              <span className="material-symbols-outlined text-[16px]">
                chevron_right
              </span>
              <a href="#" className="hover:text-primary transition-colors">
                {course?.Title}
              </a>
              <span className="material-symbols-outlined text-[16px]">
                chevron_right
              </span>
              <span className="text-white font-medium">
                {currentLesson?.Title || "Lesson"}
              </span>
            </div>
            <div className="flex gap-4">
              <button className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[20px]">
                  help
                </span>
                Get Help
              </button>
            </div>
          </div>

          {/* Video Player Container */}
          <div
            className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl shadow-primary/10 border border-glass-border relative group cursor-pointer"
            onMouseEnter={() => setIsVideoPlaying(true)}
            onMouseLeave={() => setIsVideoPlaying(false)}
          >
            {/* Video Placeholder Image */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-80"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBrH1bYAvV9jkXKrkBtFVsxeovu1Mf50xCnf21UNgs0nVONHxAUGcUXxt1-fEec4DMA9gO0QKwXTPw9FRgmX34EO0Ol_sfhZlh0GPasmaQcPC4ZWoWGhN2tSs_dpVDAfJIw3_rQIX2GD74V7GkH-gVN27NGKs23u_spTgR7IbpkrGd8KXv8JP-rsMhKPwkorNqIwfWy3xDYgSf3bXQzePwg1Loeii9IBT8yQTDO2nx0hSkwChnBdlbGUW8LHTPt2nVE4pOoagc9x94")',
              }}
            ></div>

            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-all">
              <div className="size-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-white text-[48px] ml-1">
                  play_arrow
                </span>
              </div>
            </div>

            {/* Custom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {/* Progress Bar */}
              <div className="w-full h-1 bg-white/20 rounded-full mb-4 cursor-pointer hover:h-1.5 transition-all group/progress">
                <div
                  className="h-full bg-primary rounded-full relative"
                  style={{ width: `${videoProgress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 size-3 bg-white rounded-full shadow-lg scale-0 group-hover/progress:scale-100 transition-transform"></div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-between items-center text-white">
                <div className="flex items-center gap-4">
                  <button className="hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">
                      play_arrow
                    </span>
                  </button>
                  <button className="hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">volume_up</span>
                  </button>
                  <span className="text-xs font-mono">00:00 / 12:45</span>
                </div>
                <div className="flex items-center gap-4">
                  <button className="text-xs font-bold border border-white/20 rounded px-1.5 py-0.5 hover:bg-white/10 transition-colors">
                    1x
                  </button>
                  <button className="hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">
                      closed_caption
                    </span>
                  </button>
                  <button className="hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">settings</span>
                  </button>
                  <button className="hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">
                      fullscreen
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-glass-border">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {currentLesson?.Title || "Lesson"}
              </h1>
              <p className="text-slate-400 text-sm">Last updated 2 days ago</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none h-11 px-6 rounded-lg border border-slate-600 text-white font-medium hover:bg-white/5 hover:border-slate-500 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[20px]">
                  check_circle
                </span>
                Mark as Complete
              </button>
              <button className="flex-1 md:flex-none h-11 px-6 rounded-lg bg-primary text-white font-bold hover:bg-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-2">
                Next Lecture
                <span className="material-symbols-outlined text-[20px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>

          {/* Tabbed Content */}
          <div className="flex flex-col gap-6">
            {/* Tabs Navigation */}
            <div className="flex border-b border-glass-border">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-3 font-medium text-sm flex items-center gap-2 transition-colors border-b-2 ${
                  activeTab === "overview"
                    ? "text-primary border-primary"
                    : "text-slate-400 hover:text-white border-transparent"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("resources")}
                className={`px-6 py-3 font-medium text-sm flex items-center gap-2 transition-colors border-b-2 ${
                  activeTab === "resources"
                    ? "text-primary border-primary"
                    : "text-slate-400 hover:text-white border-transparent"
                }`}
              >
                Resources{" "}
                <span className="bg-slate-800 text-xs px-1.5 rounded-sm">
                  3
                </span>
              </button>
              <button
                onClick={() => setActiveTab("qa")}
                className={`px-6 py-3 font-medium text-sm flex items-center gap-2 transition-colors border-b-2 ${
                  activeTab === "qa"
                    ? "text-primary border-primary"
                    : "text-slate-400 hover:text-white border-transparent"
                }`}
              >
                Q&A{" "}
                <span className="bg-slate-800 text-xs px-1.5 rounded-sm">
                  12
                </span>
              </button>
              <button
                onClick={() => setActiveTab("notes")}
                className={`px-6 py-3 font-medium text-sm flex items-center gap-2 transition-colors border-b-2 ${
                  activeTab === "notes"
                    ? "text-primary border-primary"
                    : "text-slate-400 hover:text-white border-transparent"
                }`}
              >
                Notes
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="glass-panel rounded-xl p-8">
                <h3 className="text-lg font-bold text-white mb-4">
                  About this lecture
                </h3>
                <p className="text-slate-300 leading-relaxed mb-6">
                  {currentLesson?.Content || "No description available"}
                </p>

                <h4 className="text-md font-bold text-white mb-3">
                  Learning Objectives
                </h4>
                <ul className="space-y-3 mb-8">
                  <li className="flex gap-3 items-start text-slate-300">
                    <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">
                      check
                    </span>
                    <span>Understand the lecture content</span>
                  </li>
                </ul>

                <div className="bg-slate-900/50 rounded-lg p-4 border border-glass-border flex items-center gap-4">
                  <div className="size-12 rounded bg-[#1e1e2e] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-blue-400">
                      code
                    </span>
                  </div>
                  <div className="flex-1">
                    <h5 className="text-white font-medium">Starter Code</h5>
                    <p className="text-slate-400 text-sm">
                      Download the starter files to follow along.
                    </p>
                  </div>
                  <button className="text-sm font-medium text-white hover:text-primary transition-colors flex items-center gap-1">
                    Download{" "}
                    <span className="material-symbols-outlined text-[18px]">
                      download
                    </span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "resources" && (
              <div className="glass-panel rounded-xl p-8">
                <h3 className="text-lg font-bold text-white mb-4">Resources</h3>
                <div className="space-y-3">
                  {[
                    "Lecture Materials",
                    "Code Examples",
                    "Additional Readings",
                  ].map((resource, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">
                          description
                        </span>
                        <span className="text-slate-300">{resource}</span>
                      </div>
                      <button className="text-primary hover:text-purple-400 transition-colors">
                        <span className="material-symbols-outlined">
                          download
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "qa" && (
              <div className="glass-panel rounded-xl p-8">
                <h3 className="text-lg font-bold text-white mb-4">
                  Questions & Answers
                </h3>
                <p className="text-slate-400">
                  Ask questions about this lesson or share your insights!
                </p>
              </div>
            )}

            {activeTab === "notes" && (
              <div className="glass-panel rounded-xl p-8">
                <h3 className="text-lg font-bold text-white mb-4">
                  Your Notes
                </h3>
                <textarea
                  className="w-full bg-slate-900/50 border border-glass-border rounded-lg p-4 text-slate-300 placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
                  placeholder="Add your notes here..."
                  rows="6"
                ></textarea>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="py-8 text-center text-slate-500 text-sm">
            © 2023 FlyUp Inc. All rights reserved.
          </footer>
        </div>
      </main>
    </div>
  );
}
