import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock a simplified processing component for testing
const ProcessingScreen: React.FC<{
  progress: number
  currentStep: string
  stats: {
    imageSize?: string
    ocrTime?: number
    dishesFound?: number
    confidence?: number
  } | null
  previewText?: string
  previewDishes?: Array<{ name: string; price: string }>
  error?: string | null
}> = ({ progress, currentStep, stats, previewText, previewDishes, error }) => {
  const getStepStatus = (stepIndex: number) => {
    const currentStepIndex = Math.floor(progress / 25)
    if (stepIndex < currentStepIndex) return 'completed'
    if (stepIndex === currentStepIndex) return 'active'
    return 'pending'
  }

  const processingSteps = [
    { label: 'Scanning image quality', detail: stats?.imageSize },
    { label: 'Extracting text from menu', detail: stats?.ocrTime ? `${(stats.ocrTime / 1000).toFixed(1)}s` : null },
    { label: 'Analyzing menu structure', detail: stats?.dishesFound ? `${stats.dishesFound} items` : null },
    { label: 'Finalizing results', detail: stats?.confidence ? `${Math.round(stats.confidence * 100)}% confidence` : null }
  ]

  return (
    <div data-testid="processing-screen">
      <h2>Analyzing Your Menu</h2>
      <div data-testid="progress-info">
        {progress}% • {currentStep}
      </div>
      
      {/* Progress Steps */}
      <div data-testid="processing-steps">
        {processingSteps.map((step, index) => {
          const status = getStepStatus(index)
          return (
            <div key={index} data-testid={`step-${index}`} data-status={status}>
              <span>{step.label}</span>
              {step.detail && <span data-testid="step-detail">{step.detail}</span>}
            </div>
          )
        })}
      </div>

      {/* Progress Bar */}
      <div data-testid="progress-bar">
        <div data-testid="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Live Stats */}
      {stats && (
        <div data-testid="live-stats">
          {stats.imageSize && (
            <div data-testid="stat-image-size">Image Size: {stats.imageSize}</div>
          )}
          {stats.ocrTime && (
            <div data-testid="stat-ocr-time">OCR Time: {(stats.ocrTime / 1000).toFixed(1)}s</div>
          )}
          {stats.dishesFound && (
            <div data-testid="stat-dishes">Dishes Found: {stats.dishesFound}</div>
          )}
          {stats.confidence && (
            <div data-testid="stat-confidence">Confidence: {Math.round(stats.confidence * 100)}%</div>
          )}
        </div>
      )}

      {/* Streaming Preview */}
      {(previewText || (previewDishes && previewDishes.length > 0)) && progress > 40 && (
        <div data-testid="streaming-preview">
          <div>Live Preview</div>
          {previewDishes && previewDishes.length > 0 ? (
            <div data-testid="preview-dishes">
              {previewDishes.map((dish, index) => (
                <div key={index} data-testid={`preview-dish-${index}`}>
                  <div>{dish.name}</div>
                  <div>{dish.price}</div>
                </div>
              ))}
            </div>
          ) : previewText && (
            <div data-testid="preview-text">
              <pre>{previewText}</pre>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div data-testid="error-message">
          {error}
        </div>
      )}
    </div>
  )
}

describe('Processing Screen - Component Tests', () => {
  test('renders initial processing state correctly', () => {
    render(
      <ProcessingScreen
        progress={0}
        currentStep="Initializing..."
        stats={null}
      />
    )

    expect(screen.getByText('Analyzing Your Menu')).toBeInTheDocument()
    expect(screen.getByText('0% • Initializing...')).toBeInTheDocument()
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument()
  })

  test('displays progress stages with correct status indicators', () => {
    render(
      <ProcessingScreen
        progress={50}
        currentStep="Analyzing menu structure..."
        stats={{
          imageSize: '2.5MB',
          ocrTime: 2500
        }}
      />
    )

    // Check step statuses
    expect(screen.getByTestId('step-0')).toHaveAttribute('data-status', 'completed')
    expect(screen.getByTestId('step-1')).toHaveAttribute('data-status', 'completed')
    expect(screen.getByTestId('step-2')).toHaveAttribute('data-status', 'active')
    expect(screen.getByTestId('step-3')).toHaveAttribute('data-status', 'pending')

    // Check progress info
    expect(screen.getByText('50% • Analyzing menu structure...')).toBeInTheDocument()
  })

  test('shows live statistics during processing', () => {
    render(
      <ProcessingScreen
        progress={75}
        currentStep="Analyzing dishes and prices..."
        stats={{
          imageSize: '1.8MB',
          ocrTime: 3200,
          dishesFound: 8,
          confidence: 0.92
        }}
      />
    )

    expect(screen.getByTestId('stat-image-size')).toHaveTextContent('Image Size: 1.8MB')
    expect(screen.getByTestId('stat-ocr-time')).toHaveTextContent('OCR Time: 3.2s')
    expect(screen.getByTestId('stat-dishes')).toHaveTextContent('Dishes Found: 8')
    expect(screen.getByTestId('stat-confidence')).toHaveTextContent('Confidence: 92%')
  })

  test('displays streaming preview for text extraction', () => {
    const previewText = 'ข้าวผัดกุ้ง 80 บาท\nต้มยำกุ้ง 120 บาท\nผัดไทย 70 บาท'

    render(
      <ProcessingScreen
        progress={50}
        currentStep="Processing extracted text..."
        stats={{ ocrTime: 2000 }}
        previewText={previewText}
      />
    )

    expect(screen.getByTestId('streaming-preview')).toBeInTheDocument()
    expect(screen.getByText('Live Preview')).toBeInTheDocument()
    expect(screen.getByTestId('preview-text')).toBeInTheDocument()
    // Check that the preview text is present (formatting may differ)
    expect(screen.getByText(/ข้าวผัดกุ้ง.*80.*บาท/)).toBeInTheDocument()
    expect(screen.getByText(/ต้มยำกุ้ง.*120.*บาท/)).toBeInTheDocument()
  })

  test('displays streaming preview for discovered dishes', () => {
    const previewDishes = [
      { name: 'ข้าวผัดกุ้ง', price: '80 บาท' },
      { name: 'ต้มยำกุ้ง', price: '120 บาท' },
      { name: 'ผัดไทย', price: '70 บาท' }
    ]

    render(
      <ProcessingScreen
        progress={80}
        currentStep="Finalizing menu analysis..."
        stats={{
          dishesFound: 8,
          confidence: 0.91
        }}
        previewDishes={previewDishes}
      />
    )

    expect(screen.getByTestId('preview-dishes')).toBeInTheDocument()
    expect(screen.getByTestId('preview-dish-0')).toBeInTheDocument()
    expect(screen.getByTestId('preview-dish-1')).toBeInTheDocument()
    expect(screen.getByTestId('preview-dish-2')).toBeInTheDocument()
    
    expect(screen.getByText('ข้าวผัดกุ้ง')).toBeInTheDocument()
    expect(screen.getByText('80 บาท')).toBeInTheDocument()
    expect(screen.getByText('ต้มยำกุ้ง')).toBeInTheDocument()
    expect(screen.getByText('120 บาท')).toBeInTheDocument()
  })

  test('does not show preview before 40% progress', () => {
    render(
      <ProcessingScreen
        progress={30}
        currentStep="Extracting text from menu..."
        stats={{ imageSize: '2.0MB' }}
        previewText="Some text"
      />
    )

    expect(screen.queryByTestId('streaming-preview')).not.toBeInTheDocument()
  })

  test('shows preview after 40% progress', () => {
    render(
      <ProcessingScreen
        progress={45}
        currentStep="Processing extracted text..."
        stats={{ ocrTime: 1500 }}
        previewText="ข้าวผัดกุ้ง 80 บาท"
      />
    )

    expect(screen.getByTestId('streaming-preview')).toBeInTheDocument()
  })

  test('displays error messages correctly', () => {
    render(
      <ProcessingScreen
        progress={20}
        currentStep="Error occurred"
        stats={null}
        error="Failed to process image. Please try again."
      />
    )

    expect(screen.getByTestId('error-message')).toBeInTheDocument()
    expect(screen.getByText('Failed to process image. Please try again.')).toBeInTheDocument()
  })

  test('progress bar reflects current progress', () => {
    const { rerender } = render(
      <ProcessingScreen
        progress={25}
        currentStep="OCR Processing..."
        stats={null}
      />
    )

    let progressFill = screen.getByTestId('progress-fill')
    expect(progressFill).toHaveStyle('width: 25%')

    rerender(
      <ProcessingScreen
        progress={75}
        currentStep="Menu Analysis..."
        stats={null}
      />
    )

    progressFill = screen.getByTestId('progress-fill')
    expect(progressFill).toHaveStyle('width: 75%')
  })

  test('step details update with processing stats', () => {
    const { rerender } = render(
      <ProcessingScreen
        progress={25}
        currentStep="Starting OCR..."
        stats={{
          imageSize: '1.5MB'
        }}
      />
    )

    // Initial state - only image size
    let stepDetail = screen.getAllByTestId('step-detail')[0]
    expect(stepDetail).toHaveTextContent('1.5MB')

    rerender(
      <ProcessingScreen
        progress={50}
        currentStep="OCR Complete"
        stats={{
          imageSize: '1.5MB',
          ocrTime: 2800
        }}
      />
    )

    // After OCR - should show processing time
    const stepDetails = screen.getAllByTestId('step-detail')
    expect(stepDetails[1]).toHaveTextContent('2.8s')
  })

  test('shows completion state at 100% progress', () => {
    render(
      <ProcessingScreen
        progress={100}
        currentStep="Complete! Preparing results..."
        stats={{
          imageSize: '2.2MB',
          ocrTime: 3100,
          dishesFound: 12,
          confidence: 0.94
        }}
      />
    )

    // All steps should be completed
    expect(screen.getByTestId('step-0')).toHaveAttribute('data-status', 'completed')
    expect(screen.getByTestId('step-1')).toHaveAttribute('data-status', 'completed')
    expect(screen.getByTestId('step-2')).toHaveAttribute('data-status', 'completed')
    expect(screen.getByTestId('step-3')).toHaveAttribute('data-status', 'completed')

    // Should show all stats
    expect(screen.getByText('100% • Complete! Preparing results...')).toBeInTheDocument()
    expect(screen.getByTestId('stat-confidence')).toHaveTextContent('94%')
  })
})

describe('Processing Screen - State Transitions', () => {
  test('simulates complete processing flow', async () => {
    const ProcessingSimulation: React.FC = () => {
      const [progress, setProgress] = React.useState(0)
      const [currentStep, setCurrentStep] = React.useState('Initializing...')
      const [stats, setStats] = React.useState<any>(null)
      const [previewDishes, setPreviewDishes] = React.useState<any[]>([])

      React.useEffect(() => {
        const simulate = async () => {
          // Stage 1: Image Analysis (0-20%)
          setProgress(5)
          setCurrentStep('Analyzing image quality...')
          setStats({ imageSize: '2.1MB' })
          await new Promise(resolve => setTimeout(resolve, 50))

          setProgress(15)
          setCurrentStep('Preparing image for OCR...')
          await new Promise(resolve => setTimeout(resolve, 50))

          // Stage 2: OCR Processing (20-70%)
          setProgress(25)
          setCurrentStep('Extracting text from menu...')
          await new Promise(resolve => setTimeout(resolve, 50))

          setProgress(50)
          setCurrentStep('Analyzing menu structure...')
          setStats(prev => ({ ...prev, ocrTime: 2500 }))
          await new Promise(resolve => setTimeout(resolve, 50))

          // Stage 3: Menu Analysis (70-90%)
          setProgress(75)
          setCurrentStep('Analyzing dishes and prices...')
          setStats(prev => ({ ...prev, dishesFound: 8, confidence: 0.91 }))
          setPreviewDishes([
            { name: 'Test Dish 1', price: '80 บาท' },
            { name: 'Test Dish 2', price: '90 บาท' }
          ])
          await new Promise(resolve => setTimeout(resolve, 50))

          // Stage 4: Finalization (90-100%)
          setProgress(90)
          setCurrentStep('Finalizing menu analysis...')
          await new Promise(resolve => setTimeout(resolve, 50))

          setProgress(100)
          setCurrentStep('Complete! Preparing results...')
        }

        simulate()
      }, [])

      return (
        <ProcessingScreen
          progress={progress}
          currentStep={currentStep}
          stats={stats}
          previewDishes={previewDishes}
        />
      )
    }

    render(<ProcessingSimulation />)

    // Should start with initialization (state changes quickly, so check first visible state)
    expect(screen.getByText(/\d+% • /)).toBeInTheDocument()

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText(/Complete!.*Preparing.*results/)).toBeInTheDocument()
    }, { timeout: 1000 })

    // Should show final stats
    expect(screen.getByTestId('stat-dishes')).toHaveTextContent('Dishes Found: 8')
    expect(screen.getByTestId('stat-confidence')).toHaveTextContent('Confidence: 91%')

    // Should show preview dishes
    expect(screen.getByTestId('preview-dishes')).toBeInTheDocument()
    expect(screen.getByText('Test Dish 1')).toBeInTheDocument()
    expect(screen.getByText('Test Dish 2')).toBeInTheDocument()
  })
})