import { useState } from 'react';
import { Coffee, Crown, CreditCard, Heart, CheckCircle } from 'lucide-react';

const Support = () => {
  const [selectedCoffee, setSelectedCoffee] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentType, setPaymentType] = useState(null); // 'coffee' or 'subscription'
  const [paymentData, setPaymentData] = useState({
    name: '',
    email: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    zipCode: ''
  });

  const coffeeOptions = [
    {
      id: 'timhortons',
      name: 'Tim Hortons Coffee',
      price: 1.99,
      description: 'Buy me a Tim Hortons coffee to show your support!',
      icon: '☕',
      color: 'bg-red-600'
    },
    {
      id: 'starbucks',
      name: 'Starbucks Coffee',
      price: 3.99,
      description: 'Buy me a Starbucks coffee to show your support!',
      icon: '☕',
      color: 'bg-green-600'
    }
  ];

  const subscriptionPlan = {
    name: 'UFC Fan App Premium Member',
    price: 5.00,
    description: 'Monthly subscription with exclusive features and content',
    features: [
      'Exclusive fight predictions',
      'Advanced fighter analytics',
      'Priority customer support',
      'Ad-free experience',
      'Early access to new features'
    ]
  };

  const handleCoffeeSelection = (coffee) => {
    setSelectedCoffee(coffee);
    setPaymentType('coffee');
    setShowPaymentForm(true);
  };

  const handleSubscriptionClick = () => {
    setPaymentType('subscription');
    setShowPaymentForm(true);
  };

  const handleInputChange = (e) => {
    setPaymentData({
      ...paymentData,
      [e.target.name]: e.target.value
    });
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    // Here you would integrate with your payment processor
    // For now, we'll just show a success message
    alert(`Thank you for your support! Payment processed for ${paymentType === 'coffee' ? selectedCoffee.name : subscriptionPlan.name}`);
    setShowPaymentForm(false);
    setSelectedCoffee(null);
    setPaymentType(null);
    setPaymentData({
      name: '',
      email: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      zipCode: ''
    });
  };

  if (showPaymentForm) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Payment</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              {paymentType === 'coffee' ? (
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{selectedCoffee.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedCoffee.name}</h3>
                    <p className="text-gray-600">{selectedCoffee.description}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xl font-bold text-green-600">${selectedCoffee.price}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Crown className="w-8 h-8 text-yellow-500" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{subscriptionPlan.name}</h3>
                    <p className="text-gray-600">Monthly subscription</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xl font-bold text-green-600">${subscriptionPlan.price}/month</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={paymentData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={paymentData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
              <input
                type="text"
                name="cardNumber"
                value={paymentData.cardNumber}
                onChange={(e) => setPaymentData({...paymentData, cardNumber: formatCardNumber(e.target.value)})}
                placeholder="1234 5678 9012 3456"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input
                  type="text"
                  name="expiryDate"
                  value={paymentData.expiryDate}
                  onChange={(e) => setPaymentData({...paymentData, expiryDate: formatExpiryDate(e.target.value)})}
                  placeholder="MM/YY"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                <input
                  type="text"
                  name="cvv"
                  value={paymentData.cvv}
                  onChange={handleInputChange}
                  placeholder="123"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                <input
                  type="text"
                  name="zipCode"
                  value={paymentData.zipCode}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setShowPaymentForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Complete Payment</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Support UFC Fan App</h1>
        <p className="text-lg text-gray-600 mb-2">
          Love the app? Help keep it running and get exclusive benefits!
        </p>
        <div className="flex items-center justify-center space-x-2 text-red-600">
          <Heart className="w-5 h-5" />
          <span className="text-sm">Your support means the world to us</span>
        </div>
      </div>

      {/* Coffee Support Section */}
      <div className="mb-12">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center space-x-2">
            <Coffee className="w-6 h-6 text-orange-600" />
            <span>Buy Me a Coffee</span>
          </h2>
          <p className="text-gray-600">Show your appreciation with a coffee purchase</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coffeeOptions.map((coffee) => (
            <div
              key={coffee.id}
              className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow"
            >
              <div className="text-center">
                <div className="text-4xl mb-4">{coffee.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{coffee.name}</h3>
                <p className="text-gray-600 mb-4">{coffee.description}</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-green-600">${coffee.price}</span>
                </div>
                <button
                  onClick={() => handleCoffeeSelection(coffee)}
                  className={`w-full px-6 py-3 ${coffee.color} text-white rounded-lg hover:opacity-90 transition-opacity font-semibold`}
                >
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Membership Section */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-8 border border-yellow-200">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center space-x-2">
            <Crown className="w-6 h-6 text-yellow-600" />
            <span>Become a Premium Member</span>
          </h2>
          <p className="text-gray-600">Get exclusive access to premium features</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{subscriptionPlan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-green-600">${subscriptionPlan.price}</span>
                <span className="text-gray-600 ml-2">/month + tax</span>
              </div>
              <p className="text-gray-600">{subscriptionPlan.description}</p>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Premium Features:</h4>
              <ul className="space-y-2">
                {subscriptionPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={handleSubscriptionClick}
              className="w-full px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all font-semibold text-lg flex items-center justify-center space-x-2"
            >
              <Crown className="w-5 h-5" />
              <span>Start Premium Membership</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 text-gray-500 text-sm">
        <p>
          All payments are processed securely. You can cancel your subscription at any time.
        </p>
        <p className="mt-2">
          Questions? Contact us at support@ufcfanapp.com
        </p>
      </div>
    </div>
  );
};

export default Support;
