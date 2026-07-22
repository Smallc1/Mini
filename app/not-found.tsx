import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-5xl font-bold text-slate-300">404</p>
      <h1 className="mt-4 text-xl font-semibold">页面不存在</h1>
      <p className="mt-2 text-slate-500">你访问的页面不存在或已被移除。</p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
      >
        返回首页
      </Link>
    </div>
  );
}
