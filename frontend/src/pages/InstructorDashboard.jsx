import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function InstructorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState("6months");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in and is an instructor
  useEffect(() => {
    if (!user) {
      toast.error("Please login as an instructor");
      navigate("/login?role=instructor");
      return;
    }

    // Check for instructor field or instructorId or role
    if (!user.instructor && !user.instructorId && user.role !== 'instructor') {
      toast.error("You do not have instructor privileges");
      navigate("/");
      return;
    }
  }, [user, navigate]);

  // Fetch instructor stats and courses
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        
        // Fetch stats
        const statsRes = await fetch(`${API_URL}/courses/instructor/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data);
        }

        // Fetch courses
        const coursesRes = await fetch(
          `${API_URL}/courses/instructor/courses?status=${statusFilter}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          setCourses(coursesData.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch instructor data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, statusFilter]);

  // Fallback stats if API fails
  const dashboardStats = stats ? {
    totalStudents: stats.totalStudents.toLocaleString(),
    studentsTrend: "+12.5%",
    totalRevenue: `$${stats.totalRevenue}`,
    revenueTrend: "+8.2%",
    totalCourses: stats.totalCourses.toString(),
    coursesTrend: "Stable",
    topCourse: {
      title: courses[0]?.Title || "N/A",
      rating: courses[0]?.Rating || 0,
      learners: courses[0]?.StudentCount?.toLocaleString() || "0"
    }
  } : {
    totalStudents: "0",
    studentsTrend: "+0%",
    totalRevenue: "$0",
    revenueTrend: "+0%",
    totalCourses: "0",
    coursesTrend: "Loading...",
    topCourse: { title: "Loading...", rating: 0, learners: "0" }
  };


  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login?role=instructor");
  };

  const handlePublish = () => {
    toast.success("Course published successfully!");
  };

  const handleEdit = (id) => {
    navigate(`/edit-course/${id}`);
  };

  const handleDelete = (id) => {
    setCourses(courses.filter(c => c.id !== id));
    toast.success("Course deleted successfully");
  };

  const handleCreateCourse = () => {
    navigate("/instructor/create-course");
  };

  // Filter courses based on status (real API already filters, but just in case)
  const filteredCourses = courses;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-display overflow-x-hidden">
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 blur-3xl"></div>
      </div>

      {/* Fixed Sidebar - Desktop */}
      <aside className="hidden lg:fixed left-0 top-0 w-64 h-screen z-50 lg:flex flex-col bg-slate-900/80 backdrop-blur-xl border-r border-white/5 p-6">
        {/* Logo */}
        <div className="mb-12 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-white text-xl">rocket_launch</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Nova Learning</h1>
            <p className="text-xs text-purple-400">Instructor Hub</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {[
            { icon: "dashboard", label: "Dashboard", active: true },
            { icon: "layers", label: "Courses" },
            { icon: "group", label: "Students" },
            { icon: "trending_up", label: "Analytics" },
            { icon: "wallet", label: "Earnings" }
          ].map((item) => (
            <a
              key={item.label}
              href="#"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                item.active
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="material-symbols-outlined text-sm">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </a>
          ))}
        </nav>

        {/* User Profile */}
        <div className="border-t border-white/10 pt-4 mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={user?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuDXE54T7SHzGeKbXXXlUxacKM7rFAAcrgZVpdd_-2TAuAz9Ux1K211OsyMyrlnV02DzXeuR3UqebcbQh48zeyPWIC0vk_SEj8mWfVnBhEaDAfpvmgpu-tfoqhf1sZy8MwHSNSQoPveBoK-PmRL90gzW18t7OHAEnHhoX0CrSXHdwoZs0DwW0pUhSRR8ZfcGKI8rYQE6eARtf3WUO9zVrR4VvcBTy-HKGmDcSPufUImWl52N8-ODbbGsWsJ_P4pmAXI0ykRDwvcrCGg"}
              alt="User"
              className="w-10 h-10 rounded-full border-2 border-purple-500/50 object-cover"
            />
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-bold text-white truncate">{user?.name || "Dr. Alaric Thorne"}</p>
              <p className="text-xs text-slate-400">Senior Instructor</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Top Navigation */}
        <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/5 bg-slate-950/40">
          <div className="px-6 lg:px-10 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-white">Teaching Dashboard</h1>
              <p className="text-slate-400 mt-1">Manage your courses and student progress</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
                <input
                  type="text"
                  placeholder="Search courses..."
                  className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 transition-all"
                />
              </div>
              <button className="p-2 hover:bg-white/5 rounded-lg transition-all relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="px-6 lg:px-10 py-8 space-y-8">
          {/* Stats Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Total Students */}
            <div className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-cyan-500/20 rounded-lg text-cyan-400">
                  <span className="material-symbols-outlined">group</span>
                </div>
                <span className="text-green-400 text-xs font-bold">+12.5%</span>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Students</p>
              <h3 className="text-white text-3xl font-bold">{dashboardStats.totalStudents}</h3>
            </div>

            {/* Total Revenue */}
            <div className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400">
                  <span className="material-symbols-outlined">account_balance_wallet</span>
                </div>
                <span className="text-green-400 text-xs font-bold">+8.2%</span>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Revenue</p>
              <h3 className="text-white text-3xl font-bold">{dashboardStats.totalRevenue}</h3>
            </div>

            {/* Total Courses */}
            <div className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-pink-500/20 rounded-lg text-pink-400">
                  <span className="material-symbols-outlined">auto_stories</span>
                </div>
                <span className="text-slate-400 text-xs font-bold">Stable</span>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Courses</p>
              <h3 className="text-white text-3xl font-bold">{dashboardStats.totalCourses}</h3>
            </div>

            {/* Top Course */}
            <div className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg text-yellow-400">
                  <span className="material-symbols-outlined">star_half</span>
                </div>
                <span className="text-green-400 text-xs font-bold">+0.1%</span>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Top Course</p>
              <div className="flex items-center gap-2 text-yellow-400">
                <span className="material-symbols-outlined text-sm">star</span>
                <span className="text-sm font-bold">{dashboardStats.topCourse.rating}</span>
              </div>
            </div>
          </section>

          {/* Earnings Chart */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">Earnings Growth</h2>
                <p className="text-slate-400 text-sm mt-1">Monthly revenue distribution</p>
              </div>
              <div className="flex gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
                {["6months", "1year", "all"].map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimeframe(period)}
                    className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                      timeframe === period
                        ? "bg-purple-500 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {period === "6months" ? "6 Months" : period === "1year" ? "1 Year" : "All Time"}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-80 w-full">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300">
                <defs>
                  <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="lineGrad" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="50%" stopColor="#ff00ff" />
                    <stop offset="100%" stopColor="#00f0ff" />
                  </linearGradient>
                </defs>
                <path d="M0,250 C100,230 200,270 300,180 C400,90 500,150 600,110 C700,70 800,120 900,40 C950,20 1000,60 1000,60 V300 H0 Z" fill="url(#chartGrad)" />
                <path d="M0,250 C100,230 200,270 300,180 C400,90 500,150 600,110 C700,70 800,120 900,40 C950,20 1000,60 1000,60" fill="none" stroke="url(#lineGrad)" strokeWidth="4" strokeLinecap="round" />
              </svg>
              <div className="flex justify-between mt-4 text-xs font-bold text-slate-500 uppercase">
                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span>
              </div>
            </div>
          </div>

          {/* Course Management Section */}
          <section>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">Your Courses</h2>
                <p className="text-slate-400 text-sm mt-1">Manage and monitor your published content</p>
              </div>
              <button
                onClick={handleCreateCourse}
                className="px-6 py-3 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600 transition-all flex items-center gap-2 w-full md:w-auto justify-center"
              >
                <span className="material-symbols-outlined">add</span>
                Create New Course
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
              {["all", "published", "draft", "archived"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                    statusFilter === status
                      ? "bg-purple-500 text-white"
                      : "bg-white/5 text-slate-400 border border-white/10 hover:border-purple-500/50"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Course Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-400">Loading courses...</p>
                </div>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-20">
                <span className="material-symbols-outlined text-6xl text-slate-700 block mb-4">inbox</span>
                <h3 className="text-xl font-bold text-white mb-2">No courses found</h3>
                <p className="text-slate-400">Create your first course to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <div key={course.Id} className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all">
                    {/* Course Image */}
                    <div className="relative h-48 overflow-hidden bg-linear-to-br from-purple-900 to-blue-900">
                      <img
                        src={course.ThumbnailUrl || "https://via.placeholder.com/400x300?text=No+Image"}
                        alt={course.Title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-60"></div>
                      
                      {/* Status Badge */}
                      <div className="absolute top-4 left-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${
                          course.Status === "published"
                            ? "bg-green-500/30 text-green-300 border-green-500/50"
                            : course.Status === "draft"
                            ? "bg-yellow-500/30 text-yellow-300 border-yellow-500/50"
                            : "bg-slate-500/30 text-slate-300 border-slate-500/50"
                        }`}>
                          {course.Status}
                        </span>
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">{course.Title}</h3>
                        <p className="text-sm text-slate-400 mt-2 line-clamp-2">{course.ShortDescription}</p>
                      </div>

                      {/* Metrics */}
                      <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">people</span>
                          {course.StudentCount || 0} Learners
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">video_library</span>
                          {course.lectureCount || 0} Lectures
                        </span>
                      </div>

                      {/* Price and Rating */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <span className="text-lg font-bold text-purple-400">
                          ${(course.DiscountPrice || course.Price || 0).toFixed(2)}
                        </span>
                        {course.Rating > 0 && (
                          <div className="flex items-center gap-1 text-yellow-400">
                            <span className="material-symbols-outlined text-sm">star</span>
                            <span className="font-bold">{course.Rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4">
                        <button
                          onClick={() => handleEdit(course.Id)}
                          className="flex-1 px-4 py-2 bg-white/5 hover:bg-purple-500/20 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          Edit
                        </button>
                        <button
                          onClick={() => handlePublish(course.Id)}
                          className="flex-1 px-4 py-2 bg-white/5 hover:bg-blue-500/20 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {course.Status === "published" ? "unpublished" : "publish"}
                          </span>
                          {course.Status === "published" ? "Unpub" : "Pub"}
                        </button>
                        <button
                          onClick={() => handleDelete(course.Id)}
                          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/5 backdrop-blur-xl border-t border-white/10 px-4 py-3 flex justify-between items-center z-40">
        <button className="text-purple-400"><span className="material-symbols-outlined">dashboard</span></button>
        <button className="text-slate-400"><span className="material-symbols-outlined">layers</span></button>
        <button onClick={handleCreateCourse} className="w-12 h-12 -mt-6 rounded-full bg-purple-500 flex items-center justify-center text-white"><span className="material-symbols-outlined">add</span></button>
        <button className="text-slate-400"><span className="material-symbols-outlined">trending_up</span></button>
        <button className="text-slate-400"><span className="material-symbols-outlined">person</span></button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}
