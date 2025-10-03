export default function StepTracker({ currentStep, onStepClick }) {
  const steps = [
    { number: 1, title: 'Passenger Details' },
    { number: 2, title: 'Select Seats' },
    { number: 3, title: 'Extra Protection' },
    { number: 4, title: 'Meal & Cab' },
    { number: 5, title: 'Checkout' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <button
                onClick={() => onStepClick(step.number)}
                disabled={step.number > currentStep}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors
                  ${
                    step.number === currentStep
                      ? 'bg-[#F27500] text-white'
                      : step.number < currentStep
                      ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {step.number < currentStep ? '✓' : step.number}
              </button>
              <span
                className={`
                  text-xs mt-2 text-center
                  ${step.number === currentStep ? 'text-[#F27500] font-semibold' : 'text-gray-500'}
                `}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`
                  flex-1 h-1 mx-2 rounded
                  ${step.number < currentStep ? 'bg-green-500' : 'bg-gray-200'}
                `}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
