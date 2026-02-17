// style.js (web React)
const colors = {
  bg: "#121213",
  text: "#ffffff",
  border: "#3a3a3c",
  filled: "#565758",
  correct: "#6AAA64",
  present: "#b59f3b",
  absent: "#3a3a3c",
  key: "#818384",
};

const styles = {
  appRoot: {
    backgroundColor: colors.bg,
    color: colors.text,
    minHeight: "100dvh",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    overflow: "hidden",
  },
  title: { fontSize: 20, fontWeight: 700, letterSpacing: 1 },

  focusable: { outline: "none" },

  hyperlink: {
    color: colors.text,
  },

  // Piilotettu input fyysiselle/mobiilinäppikselle
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
    pointerEvents: "none",
  },

  nameInput: {
    width: "clamp(170px, 19vw, 86px)",
    height: "clamp(30px, 8vw, 48px)",
    marginBottom: 10,
    display: "flex",
    alignItems: 'center',
    fontWeight: 700,
    fontSize: 14,
    backgroundColor: colors.absent,
    color: "#ffffff"
  },

  scoreBoard: {
    backgroundColor: colors.correct,
    width: "40%",
    borderRadius: 4,
  },

  roundPickerContainer: {
    width: "clamp(180px, 23vw, 92px)",
    height: "clamp(40px, 10vw, 56px)",
    gap: "clamp(18px, 4.4vw, 24px)",
    display: "flex",
    overflow: "hidden", 
  },

  colorPickerBtn: {backgroundColor: colors.absent, borderRadius: 4, color: "#ffffff", fontWeight: 600},
  colorPickerActiveBtn: {backgroundColor: colors.correct, borderRadius: 4, color: "#ffffff", fontWeight: 600},

  activeButton: {
    width: "clamp(150px, 18vw, 78px)",
    height: "clamp(40px, 10vw, 56px)",
    backgroundColor: colors.correct,
    color: "#ffffff",
    fontWeight: 700, 
    borderRadius: 4,
  },

  disabledButton: {
    width: "clamp(150px, 18vw, 78px)",
    height: "clamp(40px, 10vw, 56px)",
    backgroundColor: colors.absent,
    color: "#ffffff",
    fontWeight: 700,
    borderRadius: 4,
  },

  playerBoxContainer: {
    padding: "6px 10px",
    background: "rgba(129, 131, 132, 0.8)",
    borderRadius: 6,
    marginBottom: 6
  },

  boardRoot: { display: "grid", gap: 10, justifyItems: "center" },
  boardRow: { display: "flex", gap: "clamp(6px, 1.8vw, 8px)", paddingBottom: 5 },

  cell: {
    width: "clamp(50px, 10vw, 56px)",
    height: "clamp(50px, 10vw, 56px)",
    display: "grid",
    placeItems: "center",
    fontWeight: 700,
    fontSize: "clamp(18px, 4.5vw, 24px)",
    textTransform: "uppercase",
    borderWidth: 2,
    borderStyle: "solid",
    borderColor: colors.border,
    color: colors.text,
    borderRadius: 6,
    userSelect: "none",
    transition:
      "transform 120ms ease, background-color 120ms ease, border-color 120ms ease",
  },

  miniCell: {
    width: 18,
    height: 18,
    borderRadius: 4,
    border: "1px solid #3a3a3c",
    display: "inline-block",
    marginRight: 4,
    verticalAlign: "middle",
  },
  cellCorrect: { backgroundColor: colors.correct, borderColor: colors.correct },
  cellPresent: { backgroundColor: colors.present, borderColor: colors.present },
  cellAbsent: { backgroundColor: colors.absent, borderColor: colors.absent },
  cellFilled: { borderColor: colors.filled },

  kbdRoot: { marginTop: 16, display: "grid", gap: 8, justifyItems: "center", width: "100%", maxWidth: "520", padding: "0.8px", boxSizing: "border-box" },
  kbdRow: { display: "flex", gap: "clamp(4px, 1.2vw, 8px)", justifyContent: "center", flexWrap: "wrap" },
  keyBtn: {
    minWidth: "clamp(20px, 7.5vw, 40px)",
    height: "clamp(44px, 9vw, 56px)",
    padding: "0 clamp(6px, 1.8vw, 10px)",
    border: "none",
    borderRadius: 8,
    fontWeight: 700,
    textTransform: "uppercase",
    background: colors.key,
    color: colors.text,
    cursor: "pointer",
    boxShadow: "0 1px 0 rgba(0,0,0,0.2)",
    boxSizing: "border-box",
    flex: "0 0 auto"
  },
  keyWide: { minWidth: "clamp(20px, 7.5vw, 64px)", padding: "0 5px" },
  keyEnter: { minWidth: "clamp(76px, 18vw, 120px)", padding: "0 clamp(10px, 2.5vw, 16px)" },
};

export default styles;
