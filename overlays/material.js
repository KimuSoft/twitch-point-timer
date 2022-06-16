const Progress = styled.div`
  ${({ max, value }) => `
    width: ${(value / max) * 100}%;
  `}
  transition all linear 1s;
  background: #ff4a4a;
  height: 16px;
`

function TimerItem({ data }) {
  const [max, setMax] = React.useState(data.remainingSeconds)

  React.useEffect(() => {
    if (max < data.remainingSeconds) {
      setMax(data.remainingSeconds)
    }
  }, [data.remainingSeconds, max])

  return (
    <Mui.Paper sx={{ borderRadius: "16px", width: "100%", overflow: "hidden" }}>
      <Mui.Box sx={{ padding: 2 }}>
        <div style={{ fontSize: 24, fontWeight: 600 }}>{data.name}</div>
        <div style={{ fontSize: 18, fontWeight: 400 }}>
          {data.remainingTime}
        </div>
      </Mui.Box>
      <Progress max={max} value={data.remainingSeconds} />
    </Mui.Paper>
  )
}

function Timer() {
  const timers = useTimerData()

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        gap: 16,
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <AnimatePresence style={{ width: "100%" }}>
        {timers.map((x) => (
          <motion.div
            style={{ width: "100%" }}
            key={x.reward.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "fit-content", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <TimerItem data={x} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

render(<Timer />)
