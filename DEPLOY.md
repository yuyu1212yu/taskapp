# TaskApp デプロイガイド
## GitHub → Vercel で公開する手順（所要時間：約10分）

---

## STEP 1｜ファイルをローカルに用意する

ダウンロードした `taskapp` フォルダを任意の場所に置く。
構成はこの通り：

```
taskapp/
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── .gitignore
└── src/
    ├── main.jsx
    └── App.jsx        ← メインのアプリ
```

---

## STEP 2｜依存パッケージをインストール＆動作確認

ターミナル（Mac: Terminal / Win: PowerShell）を開き：

```bash
cd taskapp          # フォルダに移動
npm install         # パッケージインストール（初回のみ）
npm run dev         # ローカル起動
```

ブラウザで `http://localhost:5173` を開いてアプリが動くか確認する。

---

## STEP 3｜GitHubにリポジトリを作る

1. https://github.com/new を開く
2. Repository name に `taskapp`（任意）と入力
3. **Private** を選択（公開したくない場合）
4. 「Create repository」をクリック

---

## STEP 4｜コードをGitHubにプッシュ

ターミナルで：

```bash
cd taskapp

git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/【あなたのユーザー名】/taskapp.git
git push -u origin main
```

> 【あなたのユーザー名】は GitHub のユーザー名に置き換える

---

## STEP 5｜Vercel でデプロイ

1. https://vercel.com にアクセスし、「Sign Up」または「Log In」
   - 「Continue with GitHub」でGitHubアカウントと連携

2. ダッシュボードで「Add New → Project」をクリック

3. GitHubのリポジトリ一覧から `taskapp` を選んで「Import」

4. 設定画面：
   - **Framework Preset**: `Vite` を選択
   - **Build Command**: `npm run build`（自動入力されるはず）
   - **Output Directory**: `dist`（自動入力されるはず）
   - 環境変数は不要（今は）

5. 「Deploy」をクリック

6. 1〜2分で完了。URLが発行される 🎉
   - 例: `https://taskapp-xxx.vercel.app`

---

## STEP 6｜更新のたびにやること

```bash
git add .
git commit -m "update"
git push
```

GitHubにプッシュするだけで **Vercel が自動で再デプロイ**する。

---

## よくある問題

| 症状 | 対処 |
|------|------|
| `npm install` でエラー | Node.js が入っていない → https://nodejs.org からインストール |
| Vercel でビルドエラー | Build Command を `npm run build`、Output を `dist` に設定 |
| 画面が白い | ブラウザのキャッシュをクリア（Cmd+Shift+R） |

---

## 将来のアップグレード（任意）

- **データ永続化** → Supabase（無料）と接続してDBに保存
- **独自ドメイン** → Vercel のダッシュボードから `Settings → Domains` で設定
- **PWA化** → スマホのホーム画面に追加できるアプリに
- update
