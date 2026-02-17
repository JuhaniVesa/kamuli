import styles from "../styles/style";

export default function Keyboard({
  onKey,
  onBackspace,
  onEnter,
  enterLabel = "ARVAA",
  disabled = false,
  keyColors = {},
}) {
  const row1 = ["Q","W","E","R","T","Y","U","I","O","P"];
  const row2 = ["A","S","D","F","G","H","J","K","L","Ö","Ä"];
  const row3 = ["Z","X","C","V","B","N","M"];

  const keyStyle = (variant, wide) => ({
    ...styles.keyBtn,
    ...(variant === "correct" ? styles.cellCorrect :
        variant === "present" ? styles.cellPresent :
        variant === "absent" ? styles.cellAbsent : {}),
    ...(wide ? styles.keyEnter : {}),
  })

  const Key = ({ label, onClick, wide, enter, disabledProp, variant }) => (
    <button
      type="button"
      style={{
        ...keyStyle(variant), 
        ...(wide ? styles.keyWide : {}),
        ...(enter ? styles.keyEnter : {}),
    }}
      onClick={onClick}
      disabled={disabledProp}
    >
      {label}
    </button>
  );

  return (
    <div style={styles.kbdRoot}>
      <div style={styles.kbdRow}>
        {row1.map(ch => (
          <Key key={ch} label={ch} onClick={() => onKey(ch)} disabledProp={disabled} variant={keyColors[ch]} />
        ))}
        <Key label="⌫" onClick={onBackspace} wide disabledProp={disabled} />
      </div>

      <div style={styles.kbdRow}>
        {row2.map(ch => (
          <Key key={ch} label={ch} onClick={() => onKey(ch)} disabledProp={disabled} variant={keyColors[ch]} />
        ))}
      </div>

      <div style={styles.kbdRow}>
        {row3.map(ch => (
          <Key key={ch} label={ch} onClick={() => onKey(ch)} disabledProp={disabled} variant={keyColors[ch]} />
        ))}
        <Key label={enterLabel} onClick={onEnter} enter disabledProp={disabled} />
      </div>
    </div>
  );
}

