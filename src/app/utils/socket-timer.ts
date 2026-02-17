export const startTimer = (
  durationSeconds: number,
  onTick: (timeLeft: number) => void,
  onEnd: () => void
): NodeJS.Timeout => {
  let timeLeft = durationSeconds;
  onTick(timeLeft); // Initial tick

  const interval = setInterval(() => {
    timeLeft -= 1;
    onTick(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(interval);
      onEnd();
    }
  }, 1000);

  return interval;
};