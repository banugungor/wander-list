import { palette } from "@/constants/palette";
import { Text, View } from "react-native";

type RichTextProps = {
  text: string;
  color?: string;
};

const HEADING = /^#{1,3}\s+(.*)$/;
const BOLD = /\*\*(.+?)\*\*/g;

/** `**bold**` segments of one line as nested <Text>; the rest stays plain. */
function renderInline(line: string) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of line.matchAll(BOLD)) {
    const start = match.index ?? 0;
    if (start > last) parts.push(line.slice(last, start));
    parts.push(
      <Text key={start} style={{ fontWeight: "700", color: palette.ink }}>
        {match[1]}
      </Text>,
    );
    last = start + match[0].length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return parts;
}

/** The long-form text of a detail page with a tiny bit of formatting, written
 * by hand in the admin panel: a line starting with `# `/`## `/`### ` is a bold
 * heading, `**text**` is bold inline, a blank line is a gap. Anything else
 * (including a stray `*`) shows exactly as typed — no markdown library, since
 * this is all the founder asked for. */
export function RichText({ text, color = palette.inkMuted }: RichTextProps) {
  return (
    <View>
      {text.split("\n").map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <View key={index} style={{ height: 10 }} />;

        const heading = HEADING.exec(trimmed);
        if (heading) {
          return (
            <Text
              key={index}
              style={{
                marginTop: 6,
                fontSize: 16,
                fontWeight: "800",
                color: palette.ink,
                lineHeight: 24,
              }}
            >
              {heading[1]}
            </Text>
          );
        }

        return (
          <Text key={index} style={{ fontSize: 14, color, lineHeight: 22 }}>
            {renderInline(line)}
          </Text>
        );
      })}
    </View>
  );
}
