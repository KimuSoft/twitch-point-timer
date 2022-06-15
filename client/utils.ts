export const formatDuration = (seconds: number) => {
  let minute = seconds / 60
  const second = seconds % 60
  const hour = minute / 60
  minute = minute % 60
  return `${
    hour >= 1
      ? Math.floor(hour).toLocaleString("en-US", {
          minimumIntegerDigits: 2,
        }) + ":"
      : ""
  }${Math.floor(minute).toLocaleString("en-US", {
    minimumIntegerDigits: 2,
  })}:${Math.floor(second).toLocaleString("en-US", {
    minimumIntegerDigits: 2,
  })}`
}
