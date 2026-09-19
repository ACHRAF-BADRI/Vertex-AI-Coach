export function PathPreview({ path, className = "" }: { path: [number, number][]; className?: string }) {
  if (path.length < 2) return null;

  const lats = path.map((p) => p[0]);
  const lngs = path.map((p) => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const width = 300;
  const height = 140;
  const pad = 10;
  const lngScale = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
  const spanX = Math.max((maxLng - minLng) * lngScale, 1e-6);
  const spanY = Math.max(maxLat - minLat, 1e-6);
  const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY);
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;

  const points = path.map(([lat, lng]) => {
    const x = offsetX + (lng - minLng) * lngScale * scale;
    const y = height - (offsetY + (lat - minLat) * scale);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const [startX, startY] = points[0].split(",");
  const [endX, endY] = points[points.length - 1].split(",");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`w-full rounded-xl bg-gray-50 dark:bg-gray-950/60 ${className}`}>
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="#2563eb"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={startX} cy={startY} r={5} fill="#16a34a" />
      <circle cx={endX} cy={endY} r={5} fill="#dc2626" />
    </svg>
  );
}
