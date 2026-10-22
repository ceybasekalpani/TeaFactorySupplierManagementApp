import { Text } from "../../../components/Text";

export function EmptyNote({ text, colors, fs }) {
  return (
    <Text style={{ color: colors.textSecondary, fontSize: fs.xs, fontStyle: "italic" }}>
      {text}
    </Text>
  );
}
