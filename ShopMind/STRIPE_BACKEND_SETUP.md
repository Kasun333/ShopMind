# Stripe Payment Integration - Backend Implementation Guide

## Overview
This document outlines the backend implementation required for Stripe payment integration in your Spring Boot application.

## Required Dependencies

Add these dependencies to your `pom.xml`:

```xml
<dependency>
    <groupId>com.stripe</groupId>
    <artifactId>stripe-java</artifactId>
    <version>24.16.0</version>
</dependency>
```

## Configuration

### 1. Application Properties
Add to your `application.properties`:

```properties
# Stripe Configuration
stripe.secret.key=sk_test_YOUR_SECRET_KEY_HERE
stripe.webhook.secret=whsec_YOUR_WEBHOOK_SECRET_HERE
```

### 2. Stripe Configuration Class

```java
@Configuration
public class StripeConfig {
    
    @Value("${stripe.secret.key}")
    private String secretKey;
    
    @PostConstruct
    public void init() {
        Stripe.apiKey = secretKey;
    }
}
```

## Database Schema

### SQL Scripts for Required Tables

```sql
-- Orders table
CREATE TABLE orders (
    order_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PENDING',
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(user_id)
);

-- Order Items table
CREATE TABLE order_items (
    order_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (item_id) REFERENCES products(product_id)
);

-- Invoices table
CREATE TABLE invoices (
    invoice_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    invoice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

-- Payments table
CREATE TABLE payments (
    payment_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    stripe_payment_method_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    method VARCHAR(50) DEFAULT 'CARD',
    status VARCHAR(50) DEFAULT 'PENDING',
    payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);
```

## Entity Classes

### 1. Order Entity

```java
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long orderId;
    
    @Column(name = "customer_id")
    private Long customerId;
    
    @Column(name = "order_date")
    private LocalDateTime orderDate;
    
    @Enumerated(EnumType.STRING)
    private OrderStatus status;
    
    @Column(name = "total_amount")
    private BigDecimal totalAmount;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderItem> orderItems;
    
    // Constructors, getters, setters
}

public enum OrderStatus {
    PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
}
```

### 2. OrderItem Entity

```java
@Entity
@Table(name = "order_items")
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long orderItemId;
    
    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;
    
    @Column(name = "item_id")
    private Long itemId;
    
    private Integer quantity;
    private BigDecimal price;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    // Constructors, getters, setters
}
```

### 3. Invoice Entity

```java
@Entity
@Table(name = "invoices")
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long invoiceId;
    
    @OneToOne
    @JoinColumn(name = "order_id")
    private Order order;
    
    private BigDecimal amount;
    
    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus;
    
    @Column(name = "invoice_date")
    private LocalDateTime invoiceDate;
    
    @Column(name = "due_date")
    private LocalDateTime dueDate;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    // Constructors, getters, setters
}

public enum PaymentStatus {
    PENDING, PAID, FAILED, REFUNDED
}
```

### 4. Payment Entity

```java
@Entity
@Table(name = "payments")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long paymentId;
    
    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;
    
    @Column(name = "stripe_payment_intent_id")
    private String stripePaymentIntentId;
    
    @Column(name = "stripe_payment_method_id")
    private String stripePaymentMethodId;
    
    private BigDecimal amount;
    private String currency;
    private String method;
    
    @Enumerated(EnumType.STRING)
    private PaymentStatus status;
    
    @Column(name = "payment_date")
    private LocalDateTime paymentDate;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    // Constructors, getters, setters
}
```

## Service Classes

### 1. Payment Service

```java
@Service
@Transactional
public class PaymentService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private PaymentRepository paymentRepository;
    
    @Autowired
    private InvoiceRepository invoiceRepository;
    
    public PaymentIntentResponse createPaymentIntent(CreatePaymentIntentRequest request) {
        try {
            // 1. Create order first
            Order order = createOrder(request);
            
            // 2. Create payment intent with Stripe
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(request.getAmount())
                .setCurrency(request.getCurrency())
                .putMetadata("order_id", order.getOrderId().toString())
                .putMetadata("customer_id", request.getCustomerId().toString())
                .build();
            
            PaymentIntent paymentIntent = PaymentIntent.create(params);
            
            // 3. Save payment record
            Payment payment = new Payment();
            payment.setOrder(order);
            payment.setStripePaymentIntentId(paymentIntent.getId());
            payment.setAmount(new BigDecimal(request.getAmount()).divide(new BigDecimal(100)));
            payment.setCurrency(request.getCurrency());
            payment.setStatus(PaymentStatus.PENDING);
            paymentRepository.save(payment);
            
            // 4. Create invoice
            createInvoice(order);
            
            return PaymentIntentResponse.builder()
                .success(true)
                .paymentIntent(convertToPaymentIntentDto(paymentIntent))
                .orderId(order.getOrderId())
                .message("Payment intent created successfully")
                .build();
                
        } catch (StripeException e) {
            return PaymentIntentResponse.builder()
                .success(false)
                .error("Stripe error: " + e.getMessage())
                .build();
        }
    }
    
    public PaymentConfirmationResponse confirmPayment(PaymentConfirmationRequest request) {
        try {
            Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found"));
            
            Payment payment = paymentRepository.findByStripePaymentIntentId(request.getPaymentIntentId())
                .orElseThrow(() -> new RuntimeException("Payment not found"));
            
            // Update payment status
            payment.setStripePaymentMethodId(request.getPaymentMethodId());
            payment.setStatus(PaymentStatus.PAID);
            payment.setPaymentDate(LocalDateTime.now());
            paymentRepository.save(payment);
            
            // Update order status
            order.setStatus(OrderStatus.CONFIRMED);
            orderRepository.save(order);
            
            // Update invoice status
            Invoice invoice = invoiceRepository.findByOrder(order)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
            invoice.setPaymentStatus(PaymentStatus.PAID);
            invoiceRepository.save(invoice);
            
            return PaymentConfirmationResponse.builder()
                .success(true)
                .message("Payment confirmed successfully")
                .build();
                
        } catch (Exception e) {
            return PaymentConfirmationResponse.builder()
                .success(false)
                .error("Payment confirmation failed: " + e.getMessage())
                .build();
        }
    }
    
    private Order createOrder(CreatePaymentIntentRequest request) {
        Order order = new Order();
        order.setCustomerId(request.getCustomerId());
        order.setOrderDate(LocalDateTime.now());
        order.setStatus(OrderStatus.PENDING);
        order.setTotalAmount(new BigDecimal(request.getAmount()).divide(new BigDecimal(100)));
        
        order = orderRepository.save(order);
        
        // Create order items
        for (CreatePaymentIntentRequest.Item item : request.getItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setItemId(item.getProductId());
            orderItem.setQuantity(item.getQuantity());
            orderItem.setPrice(item.getPrice());
            order.getOrderItems().add(orderItem);
        }
        
        return orderRepository.save(order);
    }
    
    private void createInvoice(Order order) {
        Invoice invoice = new Invoice();
        invoice.setOrder(order);
        invoice.setAmount(order.getTotalAmount());
        invoice.setPaymentStatus(PaymentStatus.PENDING);
        invoice.setInvoiceDate(LocalDateTime.now());
        invoice.setDueDate(LocalDateTime.now().plusDays(30));
        invoiceRepository.save(invoice);
    }
}
```

## Controller Class

### Payment Controller

```java
@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {
    
    @Autowired
    private PaymentService paymentService;
    
    @PostMapping("/create-intent")
    public ResponseEntity<PaymentIntentResponse> createPaymentIntent(
            @RequestBody CreatePaymentIntentRequest request) {
        
        PaymentIntentResponse response = paymentService.createPaymentIntent(request);
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/confirm")
    public ResponseEntity<PaymentConfirmationResponse> confirmPayment(
            @RequestBody PaymentConfirmationRequest request) {
        
        PaymentConfirmationResponse response = paymentService.confirmPayment(request);
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}
```

## Request/Response DTOs

### Request DTOs

```java
@Data
public class CreatePaymentIntentRequest {
    private Long amount; // in cents
    private String currency;
    private Long customerId;
    private List<Item> items;
    
    @Data
    public static class Item {
        private Long productId;
        private Integer quantity;
        private BigDecimal price;
    }
}

@Data
public class PaymentConfirmationRequest {
    private Long orderId;
    private String paymentIntentId;
    private String paymentMethodId;
}
```

### Response DTOs

```java
@Data
@Builder
public class PaymentIntentResponse {
    private boolean success;
    private PaymentIntentDto paymentIntent;
    private Long orderId;
    private String message;
    private String error;
}

@Data
public class PaymentIntentDto {
    private String id;
    private String clientSecret;
    private Long amount;
    private String currency;
    private String status;
}

@Data
@Builder
public class PaymentConfirmationResponse {
    private boolean success;
    private String message;
    private String error;
}
```

## Repository Interfaces

```java
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerId(Long customerId);
    List<Order> findByStatus(OrderStatus status);
}

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByStripePaymentIntentId(String stripePaymentIntentId);
    List<Payment> findByOrderId(Long orderId);
}

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByOrder(Order order);
    List<Invoice> findByPaymentStatus(PaymentStatus status);
}
```

## Testing the Integration

### Test Endpoints:

1. **Create Payment Intent:**
   ```
   POST /api/payments/create-intent
   Content-Type: application/json
   
   {
     "amount": 2999,
     "currency": "usd",
     "customer_id": 1,
     "items": [
       {
         "product_id": 1,
         "quantity": 2,
         "price": 14.99
       }
     ]
   }
   ```

2. **Confirm Payment:**
   ```
   POST /api/payments/confirm
   Content-Type: application/json
   
   {
     "order_id": 1,
     "payment_intent_id": "pi_xxxxxxxxxxxxx",
     "payment_method_id": "pm_xxxxxxxxxxxxx"
   }
   ```

## Security Considerations

1. **Never expose secret keys** in frontend code
2. **Use webhook endpoints** for real-time payment status updates
3. **Implement proper authentication** for payment endpoints
4. **Validate payment amounts** on the server side
5. **Use HTTPS** in production

## Webhook Implementation (Optional but Recommended)

```java
@PostMapping("/webhook")
public ResponseEntity<String> handleStripeWebhook(
        @RequestBody String payload,
        @RequestHeader("Stripe-Signature") String sigHeader) {
    
    try {
        Event event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        
        switch (event.getType()) {
            case "payment_intent.succeeded":
                // Handle successful payment
                break;
            case "payment_intent.payment_failed":
                // Handle failed payment
                break;
            default:
                // Handle other events
                break;
        }
        
        return ResponseEntity.ok("Webhook handled");
    } catch (SignatureVerificationException e) {
        return ResponseEntity.status(400).body("Invalid signature");
    }
}
```

This implementation provides a complete backend setup for Stripe payment integration with proper database structure and API endpoints.
