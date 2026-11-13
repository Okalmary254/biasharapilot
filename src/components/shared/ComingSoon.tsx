export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold capitalize text-midnight">{title}</h2>
      <p className="mt-2 text-sm text-gray-500">This module arrives in Stage 2.</p>
    </div>
  );
}
