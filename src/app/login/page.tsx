import { GoogleLoginButton } from './GoogleLoginButton'

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 w-full max-w-sm flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-xl font-semibold text-gray-900">業務系統</h1>
          <p className="text-sm text-gray-500">請使用公司 Google 帳號登入</p>
        </div>
        <GoogleLoginButton />
        <AuthError searchParams={searchParams} />
      </div>
    </div>
  )
}

async function AuthError({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  if (!error) return null
  return (
    <p className="text-sm text-red-500">登入失敗，請再試一次</p>
  )
}
