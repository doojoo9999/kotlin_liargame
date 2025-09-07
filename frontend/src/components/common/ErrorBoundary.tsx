import {useRouteError} from "react-router-dom"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {AlertTriangle, Home, RotateCcw} from "lucide-react"

export function ErrorBoundary() {
  const error = useRouteError() as any
  
  const handleReload = () => {
    window.location.reload()
  }
  
  const handleGoHome = () => {
    window.location.href = '/main'
  }

  console.error('Route Error:', error)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            {error?.statusText || error?.message || 'An unexpected error occurred'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="default" 
            className="w-full"
            onClick={handleReload}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reload Page
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleGoHome}
          >
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
          
          {process.env.NODE_ENV === 'development' && error?.stack && (
            <details className="mt-4 p-3 bg-muted rounded-md text-xs">
              <summary className="cursor-pointer font-medium">Technical Details</summary>
              <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-40">
                {error.stack}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}