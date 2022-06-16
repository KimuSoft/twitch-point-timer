function Timer() {
  const timers = useTimerData()

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        gap: 8,
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {timers.map((x, i) => (
        <div style={{ fontSize: 24 }} key={i}>
          {x.name} - {x.remainingTime}
        </div>
      ))}
    </div>
  )
}

render(<Timer />)
