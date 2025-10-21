import SketchList from "./SketchList";

export default function SketchOverview() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sketches</h1>
        <p className="text-gray-600 mt-1">
          Manage all sketches for your theatre group
        </p>
      </div>

      <SketchList />
    </div>
  );
}
