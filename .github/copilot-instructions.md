# GitHub Copilot 指示書

このドキュメントは、`watch-pixiv-bookmarks` プロジェクトにおける GitHub Copilot
の利用に関する指示とガイドラインを定めています。

## プロジェクト概要

`watch-pixiv-bookmarks` は、pixiv のブックマークを監視し、新しいアイテムが追加されたときに Discord に通知を送信する
TypeScript/Node.js アプリケーションです。

### 技術スタック

- **言語**: TypeScript
- **ランタイム**: Node.js
- **パッケージマネージャー**: pnpm
- **主要ライブラリ**: @book000/pixivts, @book000/node-utils, axios
- **コード品質**: ESLint, Prettier, TypeScript
- **テスト**: Jest
- **デプロイメント**: Docker, Docker Compose
- **CI/CD**: GitHub Actions

## コミュニケーション規則

### 必須要件

**すべてのコミュニケーションは日本語で行ってください。**

#### Issue

- **タイトル**: 日本語で記述
- **本文**: 日本語で記述

#### Pull Request

- **タイトル**: 日本語で記述（Conventional Commits の仕様に従う）
- **本文**: 日本語で記述（Conventional Commits の仕様に従う）

#### コミットメッセージ

- **形式**: 日本語で記述（Conventional Commits の仕様に従う）

#### レビューコメント

- **形式**: 日本語で記述

#### コード内コメント

- **形式**: 日本語で記述

## Conventional Commits 仕様（日本語版）

### 基本形式

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Type の種類

以下のいずれかを使用してください：

- `feat`: 新機能追加
- `fix`: バグ修正
- `docs`: ドキュメント変更
- `style`: コードフォーマット変更
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: その他の変更

### Description

`<description>` は日本語で簡潔に記述してください。

例：

- `feat: Discord Webhook 対応を追加`
- `fix: pixiv トークン読み込みエラーを修正`
- `docs: README に環境変数の説明を追加`

### Body（詳細説明）

`[optional body]` は変更の詳細な説明を日本語で記述します。

### 例

```text
feat: Discord Webhook 対応を追加

DISCORD_WEBHOOK_URL 環境変数が設定されている場合、
Webhook を使用して Discord に通知を送信する機能を追加。
従来の Bot Token + Channel ID による通知方法も引き続き利用可能。

関連 Issue: #123
```

## フォーマット規則

### 文書作成時の規則

1. **見出しと本文の間には空白行を入れる**

   ✅ 正しい例：

   ```markdown
   ## 見出し

   本文がここに続きます。
   ```

   ❌ 間違った例：

   ```markdown
   ## 見出し
   本文がここに続きます。
   ```

2. **英数字と日本語の間には半角スペースを入れる**

   ✅ 正しい例：

   - `TypeScript ファイルを作成`
   - `Node.js バージョン 18 以上が必要`
   - `API レスポンスの JSON 形式`

   ❌ 間違った例：

   - `TypeScriptファイルを作成`
   - `Node.jsバージョン18以上が必要`
   - `APIレスポンスのJSON形式`

## コーディング指針

### TypeScript/JavaScript コーディング規則

1. **型安全性を重視**
   - 型注釈を適切に使用
   - `any` 型の使用を避ける
   - 型ガードを適切に実装

2. **エラーハンドリング**
   - 適切な例外処理を実装
   - ログ出力には `@book000/node-utils` の Logger を使用

3. **コード品質**
   - ESLint ルールに従う
   - Prettier でフォーマットを統一
   - 定期的に `pnpm lint` を実行

### コメント記述規則

```typescript
// ✅ 正しい例: 日本語でのコメント
/**
 * pixiv のブックマーク情報を取得する
 * @param userId ユーザー ID
 * @returns ブックマーク一覧
 */
async function getBookmarks(userId: string): Promise<Bookmark[]> {
  // トークンの有効性を確認
  if (!isValidToken(token)) {
    throw new Error('無効なトークンです')
  }
  
  // API リクエストを実行
  return await pixiv.getBookmarks(userId)
}
```

## テスト指針

### テストコード作成規則

1. **テストファイルの命名**: `*.test.ts` 形式
2. **テストケースの記述**: 日本語で分かりやすく
3. **テストの実行**: `pnpm test` コマンドを使用

```typescript
// ✅ 正しい例: 日本語でのテスト記述
describe('getBookmarks 関数', () => {
  test('有効なユーザー ID でブックマークを取得できる', async () => {
    // テストの実装
  })

  test('無効なユーザー ID の場合はエラーが発生する', async () => {
    // テストの実装
  })
})
```

## Docker と環境設定

### 環境変数

以下の環境変数を適切に設定してください：

- `DISCORD_TOKEN`: Discord Bot トークン
- `DISCORD_CHANNEL_ID`: 通知送信先チャンネル ID
- `DISCORD_WEBHOOK_URL`: Discord Webhook URL（オプション）
- `PIXIV_USER_ID`: 監視対象の pixiv ユーザー ID
- `PIXIV_TOKEN_PATH`: pixiv トークンファイルのパス（デフォルト: `data/token.json`）

### Docker の使用

開発時は `docker compose up --build -d` でアプリケーションを起動してください。

## 依存関係管理

- **パッケージマネージャー**: pnpm のみを使用
- **依存関係の追加**: `pnpm add <package>` または `pnpm add -D <package>`
- **セキュリティ更新**: Renovate による自動更新に依存

## CI/CD

### GitHub Actions ワークフロー

1. **nodejs-ci-pnpm.yml**: Node.js CI（リント、テスト、ビルド）
2. **docker.yml**: Docker イメージのビルドと公開
3. **add-reviewer.yml**: レビューワーの自動追加

### 品質チェック

プルリクエスト作成時に以下が自動実行されます：

- ESLint によるコード解析
- Prettier によるフォーマットチェック
- TypeScript コンパイルチェック
- Jest によるテスト実行

## その他の注意事項

### セキュリティ

- トークンやシークレットをコードに含めない
- 環境変数または設定ファイルを使用
- `.gitignore` でセンシティブファイルを除外

### パフォーマンス

- API 呼び出し頻度に注意
- 適切なエラーリトライ機構を実装
- ログレベルを適切に設定

この指示書に従って、一貫性のある高品質なコードとドキュメントの作成をお願いします。
