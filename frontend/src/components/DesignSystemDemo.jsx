import React from 'react'
import {Button, Card, CardContent, CardDescription, CardHeader, CardTitle} from './ui'

// Simple demo component to verify our design system components
export const DesignSystemDemo = () => {
  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Design System Demo</h1>
      
      <section style={{ marginBottom: '32px' }}>
        <h2>Buttons</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <Button variant="liar">Liar</Button>
          <Button variant="citizen">Citizen</Button>
          <Button variant="action">Action</Button>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <Button size="small">Small</Button>
          <Button size="medium">Medium</Button>
          <Button size="large">Large</Button>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button isLoading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>Cards</h2>
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <Card>
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>This is a default card with standard styling</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card content goes here with proper spacing and typography.</p>
            </CardContent>
          </Card>
          
          <Card variant="hoverable">
            <CardHeader>
              <CardTitle>Hoverable Card</CardTitle>
              <CardDescription>Hover over this card to see the effect</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This card has hover animations and elevated shadow.</p>
            </CardContent>
          </Card>
          
          <Card variant="interactive" onClick={() => alert('Card clicked!')}>
            <CardHeader>
              <CardTitle>Interactive Card</CardTitle>
              <CardDescription>Click this card to interact with it</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This card is clickable and has scale animations.</p>
            </CardContent>
          </Card>
        </div>
        
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: '16px' }}>
          <Card variant="player">
            <CardContent>
              <h4 style={{ margin: 0, marginBottom: '8px' }}>Player Card</h4>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Game-specific player card styling</p>
            </CardContent>
          </Card>
          
          <Card variant="active">
            <CardContent>
              <h4 style={{ margin: 0, marginBottom: '8px' }}>Active Player</h4>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Currently active player with gradient top border</p>
            </CardContent>
          </Card>
          
          <Card variant="speaking">
            <CardContent>
              <h4 style={{ margin: 0, marginBottom: '8px' }}>Speaking</h4>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Player currently speaking</p>
            </CardContent>
          </Card>
          
          <Card variant="voting">
            <CardContent>
              <h4 style={{ margin: 0, marginBottom: '8px' }}>Voting</h4>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Player in voting state</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2>Design Tokens Applied</h2>
        <Card padding="lg">
          <CardContent>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>✅ White-mode color palette with game-specific colors</li>
              <li>✅ Consistent 8px-based spacing system</li>
              <li>✅ Pretendard typography with comprehensive scales</li>
              <li>✅ Soft shadows optimized for rounded design</li>
              <li>✅ 16px-based border radius system (matching gameTheme)</li>
              <li>✅ Smooth animations and transitions</li>
              <li>✅ Accessibility features (focus states, keyboard navigation)</li>
              <li>✅ Game-specific variants for liar game mechanics</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export default DesignSystemDemo