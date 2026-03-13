export default async function handler(req, res) {

  const { goal } = req.body || {};

  if (!goal) {
    return res.status(400).json({ error: "Goal is required" });
  }

  const tasks = [
    `${goal}についてリサーチする`,
    `${goal}の今日やる小さなタスクを決める`,
    `${goal}の1つ目の行動を実行する`
  ];

  res.status(200).json({ tasks });

}
