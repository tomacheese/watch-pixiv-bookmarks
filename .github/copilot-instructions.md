# GitHub Copilot Instructions

## プロジェクト概要
- 目的: pixiv のブックマークを監視し、新規ブックマークを Discord に通知する
- 主な機能: ブックマーク（イラスト・小説）の取得、新規ブックマークの判定、Discord への詳細な通知（画像付き）
- 対象ユーザー: 開発者（個人利用）

## 共通ルール
- 会話は日本語で行う。
- PR とコミットは Conventional Commits に従う。
- 日本語と英数字の間には半角スペースを入れる。

## 技術スタック
- 言語: TypeScript
- 実行環境: Node.js (tsx)
- パッケージマネージャー: pnpm
- 主要ライブラリ:
  - `@book000/pixivts`: pixiv API クライアント
  - `@book000/node-utils`: Logger, Discord 通知ユーティリティ
  - `axios`: 画像バイナリ取得用

## コーディング規約
- フォーマット: Prettier
- Lint: ESLint
- 命名規則: キャメルケース (変数・関数)、パスカルケース (クラス・インターフェース)
- docstring: 関数やインターフェースには JSDoc 形式で日本語の解説を記載する

## 開発コマンド
```bash
# 依存関係のインストール
pnpm install

# 開発実行 (watch モード)
pnpm dev

# 通常実行
pnpm start

# テスト実行
pnpm test

# Lint 実行
pnpm lint

# 自動修正実行
pnpm fix
```

## テスト方針
- フレームワーク: Jest
- テスト追加の方針: ロジックの変更や新規機能追加時には `**/*.test.ts` としてテストを作成する

## セキュリティ / 機密情報
- `data/token.json` や環境変数に含まれる認証情報をコミットしない。
- ログにアクセストークンなどの機密情報を出力しない。

## ドキュメント更新
- `README.md` の設定方法や使用方法に変更がある場合は更新する。

## リポジトリ固有
- 実行には pixiv のリフレッシュトークンが必要であり、`data/token.json` に保存・更新される。
- 通知済みリストは `data/notified.json` で管理される。
