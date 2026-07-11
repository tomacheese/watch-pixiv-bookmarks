# GitHub Copilot code review instructions

pixiv のブックマークを監視し、新規分を Discord に通知する TypeScript (Node.js / tsx / pnpm) プロジェクト。以下はコードレビュー時の重点確認事項。

## レビュー時の言語

- レビューコメントは日本語で記載する。
- 日本語と英数字の間には半角スペースを入れる。

## 重点的に確認する点

- 認証情報の漏洩: pixiv のリフレッシュトークン・アクセストークンや `data/token.json`、Discord トークンをログ出力・コミット・エラーメッセージに含めていないか。
- エラーハンドリング: pixiv API 呼び出し（`userBookmarksIllust` / `userBookmarksNovel` 等）は `status !== 200` を確認しているか。`fetch` の失敗（`res.ok` が false）を握り潰していないか。
- 通知の冪等性: `Notified.isNotified` / `Notified.addNotified` を通し、通知済みアイテムを重複通知しないこと。初回起動（`isFirst`）時は通知を送らず既読登録のみ行う既存挙動を壊さないこと。
- 型安全性: `skipLibCheck: true` による型チェック回避を追加していないか。`tsc`（`pnpm lint` に含まれる）が通ること。
- レート対策: Discord への連続送信間に存在する待機（`setTimeout` 1 秒）を削除していないか。

## コーディング規約（lint / formatter で強制）

- Prettier: セミコロンなし (`semi: false`)、シングルクォート、`printWidth: 80`、末尾カンマ es5、アロー関数の括弧は常時。手動整形で規約に反していないか。
- ESLint: `@book000/eslint-config` に準拠。
- 命名: 変数・関数はキャメルケース、クラス・インターフェースはパスカルケース。
- 関数・インターフェースには日本語の JSDoc を付与する方針。

## フラグ不要（誤検知しやすい既知パターン）

- HTTP クライアントに axios ではなく標準 `fetch` を使用しているのは意図的。axios への置き換えを提案しない。
- 通知済み管理は DB ではなく `data/notified.json` の単純な JSON。設計上の選択であり、DB 化を提案しない。
- テストファイルが存在しないため CI のテストは `--passWithNoTests` で通過する。これ自体は既知の状態。

## テスト

- フレームワークは Jest（`ts-jest`、`**/*.test.ts`）。ロジック変更時はテスト追加が望ましい。
