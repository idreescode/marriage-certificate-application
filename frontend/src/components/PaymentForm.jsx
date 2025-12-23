import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import toast from 'react-hot-toast';

const PaymentForm = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // 1. Create Payment Intent
      const { data: intentData } = await axios.post(
        'http://localhost:5000/api/payment/create-payment-intent',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!intentData.success) {
        throw new Error(intentData.message || 'Failed to initialize payment');
      }

      const clientSecret = intentData.clientSecret;

      // 2. Confirm Payment with Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (result.error) {
        toast.error(result.error.message);
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          // 3. Confirm with Backend
          await axios.post(
            'http://localhost:5000/api/payment/confirm-payment',
            { paymentIntentId: result.paymentIntent.id },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          toast.success('Payment successful!');
          onSuccess();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Payment failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    style: {
      base: {
        color: "#32325d",
        fontFamily: 'Arial, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#aab7c4"
        }
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a"
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="p-4 border rounded-md bg-white shadow-sm">
        <CardElement options={cardStyle} />
      </div>
      <button 
        type="submit" 
        disabled={!stripe || loading} 
        className="btn btn-primary w-full mt-4"
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? 'Processing Payment...' : 'Pay Now'}
      </button>
    </form>
  );
};

export default PaymentForm;
