import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@acme/ui";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Admin UI — smoke test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Search…" />
          <div className="flex gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}