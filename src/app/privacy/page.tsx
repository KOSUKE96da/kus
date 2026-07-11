export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-12 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">プライバシーポリシー</h1>
      <p className="text-sm text-gray-500 mb-8">最終更新日：2026年7月11日</p>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">1. 収集する情報</h2>
        <p className="text-gray-700 text-sm leading-relaxed">
          KuroFeedは、アカウント登録時にメールアドレスおよびパスワード（暗号化して保存）を収集します。
          また、ユーザーが登録したRSSフィードのURL、既読状態、お気に入り情報をサービス提供のために保存します。
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">2. 情報の利用目的</h2>
        <p className="text-gray-700 text-sm leading-relaxed">
          収集した情報は、KuroFeedのサービス提供（ログイン認証、フィード管理、既読管理）のみに使用します。
          第三者への販売・提供は行いません。
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">3. データの保存</h2>
        <p className="text-gray-700 text-sm leading-relaxed">
          データはTurso（libSQL）クラウドデータベースに保存されます。
          パスワードはbcryptにより暗号化して保存し、平文では保存しません。
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Cookieの使用</h2>
        <p className="text-gray-700 text-sm leading-relaxed">
          ログインセッションの維持のためにCookieを使用します。
          広告目的のCookieは使用しません。
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">5. データの削除</h2>
        <p className="text-gray-700 text-sm leading-relaxed">
          アプリの設定画面（設定 → アカウント削除）から、いつでもご自身のアカウントを削除できます。
          アカウントを削除すると、登録サイト・記事・既読状態・お気に入りを含むすべてのデータが即座に完全削除されます。
          この操作は取り消せません。
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">6. お問い合わせ</h2>
        <p className="text-gray-700 text-sm leading-relaxed">
          プライバシーに関するご質問は以下までご連絡ください。<br />
          メール：fly.number787@gmail.com
        </p>
      </section>
    </div>
  );
}
