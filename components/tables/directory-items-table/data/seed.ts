import fs from "fs"
import path from "path"

const tasks = Array.from({ length: 100 }, () => ({
  id: `TASK-1`,
  title: "Title",
  status: "Todo",
  label: "Feature",
  priority: "High",
}))

fs.writeFileSync(
  path.join(__dirname, "tasks.json"),
  JSON.stringify(tasks, null, 2)
)

console.log("✅ Tasks data generated.")
