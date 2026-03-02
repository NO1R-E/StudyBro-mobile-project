const isOverlapping = (newStart, newEnd, existingStart, existingEnd) => {
  if (!newStart || !newEnd || !existingStart || !existingEnd) return false;
  const toMin = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const ns = toMin(newStart);
  const ne = toMin(newEnd);
  const es = toMin(existingStart);
  const ee = toMin(existingEnd);

  return ns < ee && ne > es;
};

export default isOverlapping;
