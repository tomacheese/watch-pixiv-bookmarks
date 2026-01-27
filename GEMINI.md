# GEMINI.md

## 目的
このドキュメントは、Gemini CLI 向けのコンテキストと作業方針を定義します。

## 出力スタイル
- 言語: 日本語
- トーン: プロフェッショナルかつ簡潔
- 形式: GitHub Flavored Markdown

## 共通ルール
- 会話は日本語で行う。
- コミットメッセージは Conventional Commits に従い、日本語で内容を記載する。
- 日本語と英数字の間には半角スペースを挿入する。

## プロジェクト概要
- 目的: pixiv のブックマークを監視し、新規分を Discord に通知する
- 主な機能: ブックマーク巡回、新規判定、画像付き通知

## コーディング規約
- フォーマット: Prettier
- 命名規則: キャメルケース (変数・関数)、パスカルケース (クラス・インターフェース)
- コメント: 日本語
- エラーメッセージ: 英語（既存の絵文字スタイルを維持）

## 開発コマンド
```bash
# インストール
pnpm install

# 実行
pnpm start

# テスト
pnpm test

# Lint
pnpm lint
pnpm fix
```

## 注意事項
- 認証情報 (pixiv token) の漏洩に細心の注意を払う。
- 既存のプロジェクト構成（`src/main.ts`, `src/notified.ts`）を尊重する。
- ライブラリは `@book000/node-utils` や `@book000/pixivts` を優先して使用する。

## リポジトリ固有
- `data/notified.json` が通知済みの ID を保持する重要なファイルである。
- 定期実行は外部（Cron や Docker 等）で行われることを想定している。
