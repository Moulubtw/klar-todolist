import { AuthGate } from '@/components/AuthGate'
import { TodoApp } from '@/components/TodoApp'

export default function HomePage() {
  return (
    <AuthGate>
      <TodoApp />
    </AuthGate>
  )
}
