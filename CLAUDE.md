# CLAUDE.md

## 目的
このドキュメントは、Claude Code の作業方針とプロジェクト固有のルールを示します。

## 判断記録のルール
- 判断内容の要約
- 検討した代替案
- 採用しなかった案とその理由
- 前提条件・仮定・不確実性
- 他エージェントによるレビュー可否

## プロジェクト概要
- 目的: pixiv のブックマークを監視し、新規ブックマークを Discord に通知する
- 主な機能: イラスト・小説のブックマーク監視、Discord 通知、通知済み管理

## 重要ルール
- 会話と言語: 日本語を使用する。
- コード内コメント: 日本語で記載する。
- エラーメッセージ: 英語で記載する。
- コミット規約: Conventional Commits に従う。`<description>` は日本語。
- スペース: 日本語と英数字の間には半角スペースを挿入する。

## 環境のルール
- ブランチ命名: Conventional Branch (`feat/description`, `fix/description`) に従う。
- Renovate: Renovate が作成した PR に対しては追加コミットを行わない。

## コード改修時のルール
- エラーメッセージの絵文字: 既存のメッセージに合わせて適切な絵文字を先頭に付与する（例: `🚨` エラー、`📸` イラスト、`📚` 小説）。
- TypeScript: `skipLibCheck: true` による型チェック回避は禁止。
- docstring: 関数・インターフェースに日本語で JSDoc を記載する。

## セキュリティ / 機密情報
- `data/` 配下のファイル（`data/token.json` 等）や環境変数に含まれる認証情報をコミットに含めない。
- ログ出力に pixiv のリフレッシュトークンやアクセストークン等の認証情報を含めない。

## 開発コマンド
```bash
# インストール
pnpm install

# 実行
pnpm start

# 開発
pnpm dev

# テスト
pnpm test

# Lint / Format
pnpm lint
pnpm fix
```

## アーキテクチャと主要ファイル
- `src/main.ts`: メインロジック（pixiv 取得、通知ループ）
- `src/notified.ts`: 通知済みアイテムの永続化管理
- `data/`: トークンや通知済みリストの保存先（.gitignore 指定）

## テスト
- テストフレームワーク: Jest（`ts-jest`、テストは `**/*.test.ts`）。
- 現状テストファイルは存在せず、`pnpm test` は `--passWithNoTests` で通過する。
- 方針: 重要なロジック（通知判定など）を変更・追加する際はテストを作成する。
- 手動確認: `data/token.json` と Discord 通知先を設定した上で `pnpm start` を実行し、通知動作を確認する。

## 作業チェックリスト

### 新規改修時
1. プロジェクト構造と `package.json` を理解する
2. 適切な `feat/` または `fix/` ブランチを作成する
3. 最新の `master` ブランチに基づいているか確認する

### コミット・プッシュ前
1. Conventional Commits 形式を確認する
2. 機密情報（トークン等）が含まれていないか確認する
3. `pnpm lint` でエラーがないことを確認する
4. 動作確認を行う

### PR 作成前
1. ユーザーの依頼があることを確認する
2. コンフリクトの可能性を確認する

### PR 作成後
1. `gh pr checks` で CI の成功を確認する
2. GitHub Copilot のレビューに対応する

## リポジトリ固有
- `@book000/pixivts` を使用して pixiv API と通信している。
- `@book000/node-utils` の `Logger` と `Discord` クラスを標準的に使用する。
- 画像バイナリの取得は標準の `fetch` で行う（axios 等の HTTP クライアントは使用していない）。
- 通知済み管理は `data/notified.json`（`Notified` クラス）で単純な JSON として行われている。
- 定期実行は `entrypoint.sh` が `pnpm start` を 5 分間隔でループする方式（Docker 前提）。
