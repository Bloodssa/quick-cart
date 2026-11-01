
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Package, Truck } from "lucide-react";
import { getErrorMessage } from "../../api/client";
import Skeleton from "../../components/ui/Skeleton";
import StatusBadge from "../../components/orders/StatusBadge";
import {
    useAdminOrder,
    useUpdateAdminOrderStatus,
} from "../../queries/adminOrders";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { formatDate, formatPrice } from "../../lib/format";

const ORDER_STEPS = [
    "Pending",
    "Confirmed",
    "Processing",
    "Completed",
];

const NEXT_ACTIONS = {
    Pending: [
        { status: "Confirmed", label: "Confirm Order" },
        { status: "Cancelled", label: "Cancel Order", danger: true },
    ],
    Confirmed: [
        { status: "Processing", label: "Start Processing" },
        { status: "Cancelled", label: "Cancel Order", danger: true },
    ],
    Processing: [
        { status: "Completed", label: "Mark Completed" },
        { status: "Cancelled", label: "Cancel Order", danger: true },
    ],
    Completed: [],
    Cancelled: [],
};

function Section({ title, children, className = "" }) {
    return (
        <section
            className={`rounded-md border border-gray-300 bg-white p-5 ${className}`}
        >
            <h2 className="font-bold text-neutral-900">{title}</h2>
            {children}
        </section>
    );
}

function OrderProgress({ status }) {
    if (status === "Cancelled") {
        return (
            <div className="rounded-md bg-red-50 p-4">
                <p className="font-semibold text-red-700">
                    Order cancelled
                </p>
                <p className="mt-1 text-sm text-red-600">
                    This order can no longer progress through fulfillment.
                </p>
            </div>
        );
    }

    const currentIndex = ORDER_STEPS.indexOf(status);

    return (
        <div className="grid grid-cols-4 gap-2">
            {ORDER_STEPS.map((step, index) => {
                const completed = index < currentIndex;
                const current = index === currentIndex;

                return (
                    <div key={step} className="min-w-0">
                        <div
                            className={`mb-2 h-1.5 rounded-full ${completed || current
                                    ? "bg-accent-100"
                                    : "bg-gray-200"
                                }`}
                        />
                        <p
                            className={`text-xs ${current
                                    ? "font-bold text-neutral-900"
                                    : completed
                                        ? "text-neutral-700"
                                        : "text-neutral-400"
                                }`}
                        >
                            {step}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}

export default function AdminOrderDetails() {
    const { id } = useParams();

    const {
        data: order,
        isPending,
        error,
    } = useAdminOrder(id);

    const updateMutation = useUpdateAdminOrderStatus();

    useDocumentTitle(
        order ? `Order ${order.orderNumber}` : "Order"
    );

    const backLink = (
        <Link
            to="/admin/orders"
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-accent-100"
        >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to orders
        </Link>
    );

    if (isPending) {
        return (
            <div role="status" className="space-y-4">
                <span className="sr-only">Loading order...</span>
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-48" />
                <Skeleton className="h-32" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <>
                {backLink}
                <div
                    role="alert"
                    className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-600"
                >
                    {error
                        ? getErrorMessage(error)
                        : "Order not found."}
                </div>
            </>
        );
    }

    const { address, payment } = order;
    const paymentStatus = payment?.paymentStatus;
    const actions = NEXT_ACTIONS[order.status] ?? [];
    const isUpdating = updateMutation.isPending;

    const handleOrderStatus = (nextStatus) => {
        if (isUpdating) return;

        if (
            nextStatus === "Cancelled" &&
            !window.confirm(
                "Are you sure you want to cancel this order?"
            )
        ) {
            return;
        }

        updateMutation.mutate({
            id: order.id,
            status: nextStatus,
            paymentStatus,
        });
    };

    const handlePaymentStatus = (nextPaymentStatus) => {
        if (isUpdating || !payment) return;

        if (
            nextPaymentStatus === "Paid" &&
            !window.confirm(
                "Confirm that the payment has actually been received or verified."
            )
        ) {
            return;
        }

        updateMutation.mutate({
            id: order.id,
            status: order.status,
            paymentStatus: nextPaymentStatus,
        });
    };

    return (
        <div className="space-y-6">
            {backLink}

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">
                        Order {order.orderNumber}
                    </h1>
                    <p className="mt-1 text-sm text-neutral-500">
                        Placed on {formatDate(order.orderDate)}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500">
                            Order
                        </span>
                        <StatusBadge status={order.status} />
                    </div>

                    {payment && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500">
                                Payment
                            </span>
                            <StatusBadge status={paymentStatus} />
                        </div>
                    )}
                </div>
            </div>

            {/* Fulfillment progress */}
            <Section title="Order Progress">
                <div className="mt-5">
                    <OrderProgress status={order.status} />
                </div>

                {actions.length > 0 && (
                    <div className="mt-6 border-t border-gray-200 pt-5">
                        <h3 className="text-sm font-semibold text-neutral-900">
                            Available Actions
                        </h3>

                        <p className="mt-1 text-sm text-neutral-500">
                            Choose the next valid action for this order.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {actions.map((action) => (
                                <button
                                    key={action.status}
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() =>
                                        handleOrderStatus(action.status)
                                    }
                                    className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${action.danger
                                            ? "border border-red-200 text-red-600 hover:bg-red-50"
                                            : "bg-accent-100 text-white hover:opacity-90"
                                        }`}
                                >
                                    {isUpdating ? (
                                        "Updating..."
                                    ) : action.status === "Confirmed" ? (
                                        <>
                                            <CheckCircle2 size={16} />
                                            {action.label}
                                        </>
                                    ) : action.status === "Processing" ? (
                                        <>
                                            <Package size={16} />
                                            {action.label}
                                        </>
                                    ) : action.status === "Completed" ? (
                                        <>
                                            <Truck size={16} />
                                            {action.label}
                                        </>
                                    ) : (
                                        action.label
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {actions.length === 0 && (
                    <p className="mt-5 border-t border-gray-200 pt-4 text-sm text-neutral-500">
                        {order.status === "Completed"
                            ? "This order has been completed."
                            : "This order has been cancelled. No further status changes are available."}
                    </p>
                )}
            </Section>

            {/* Main content */}
            <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
                <div className="space-y-6">
                    {/* Items */}
                    <section className="rounded-md border border-gray-300 bg-white px-5">
                        <h2 className="border-b border-gray-200 py-4 font-bold text-neutral-900">
                            Items ({order.items.length})
                        </h2>

                        <ul className="divide-y divide-gray-200">
                            {order.items.map((item) => (
                                <li
                                    key={item.productId}
                                    className="flex gap-4 py-4"
                                >
                                    <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-300">
                                        {item.imageUrl ? (
                                            <img
                                                src={item.imageUrl}
                                                alt={item.productName}
                                                className="h-full w-full object-contain p-1"
                                            />
                                        ) : (
                                            <span className="text-xs text-neutral-500">
                                                No image
                                            </span>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="line-clamp-2 font-semibold text-neutral-900">
                                            {item.productName}
                                        </p>
                                        <p className="mt-0.5 text-sm text-neutral-500">
                                            {formatPrice(item.unitPrice)} ×{" "}
                                            {item.quantity}
                                        </p>
                                    </div>

                                    <p className="shrink-0 font-bold text-neutral-900">
                                        {formatPrice(item.subTotal)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Customer and delivery */}
                    <Section title="Customer & Delivery">
                        <p className="mt-3 font-semibold text-neutral-900">
                            {order.customerName}
                        </p>

                        <h3 className="mt-5 text-sm font-semibold text-neutral-900">
                            Delivery address
                        </h3>

                        <p className="mt-2 text-sm text-neutral-700">
                            {address.recipientName}
                        </p>
                        <p className="text-sm text-neutral-500">
                            {address.contactNumber}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-neutral-500">
                            {address.addressLine}, {address.barangay},{" "}
                            {address.city}, {address.province}{" "}
                            {address.postalCode}
                        </p>
                    </Section>
                </div>

                <div className="space-y-6">
                    {/* Payment */}
                    {payment && (
                        <Section title="Payment">
                            <dl className="mt-4 space-y-3 text-sm">
                                <div className="flex justify-between gap-3">
                                    <dt className="text-neutral-500">
                                        Method
                                    </dt>
                                    <dd className="text-right font-medium">
                                        {payment.paymentMethod}
                                    </dd>
                                </div>

                                <div className="flex justify-between gap-3">
                                    <dt className="text-neutral-500">
                                        Amount
                                    </dt>
                                    <dd className="font-medium">
                                        {formatPrice(payment.amount)}
                                    </dd>
                                </div>

                                <div className="flex justify-between gap-3">
                                    <dt className="text-neutral-500">
                                        Payment status
                                    </dt>
                                    <dd>
                                        <StatusBadge status={paymentStatus} />
                                    </dd>
                                </div>

                                {payment.transactionDate && (
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-neutral-500">
                                            Date
                                        </dt>
                                        <dd className="text-right font-medium">
                                            {formatDate(
                                                payment.transactionDate
                                            )}
                                        </dd>
                                    </div>
                                )}

                                {payment.transactionReference && (
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-neutral-500">
                                            Reference
                                        </dt>
                                        <dd className="break-all text-right text-xs font-medium">
                                            {payment.transactionReference}
                                        </dd>
                                    </div>
                                )}
                            </dl>

                            {paymentStatus !== "Paid" &&
                                order.status !== "Cancelled" && (
                                    <div className="mt-5 border-t border-gray-200 pt-4">
                                        <p className="text-xs leading-5 text-neutral-500">
                                            Only record payment after it has
                                            actually been received or verified.
                                        </p>

                                        <button
                                            type="button"
                                            disabled={isUpdating}
                                            onClick={() =>
                                                handlePaymentStatus("Paid")
                                            }
                                            className="mt-3 min-h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            {isUpdating
                                                ? "Updating..."
                                                : "Mark Payment as Paid"}
                                        </button>
                                    </div>
                                )}

                            {paymentStatus === "Paid" && (
                                <p className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700 border border-green-700">
                                    Payment has been recorded as paid.
                                </p>
                            )}
                        </Section>
                    )}

                    {/* Summary */}
                    <Section title="Order Summary">
                        <dl className="mt-4 space-y-3 text-sm">
                            <div className="flex justify-between gap-3">
                                <dt className="text-neutral-500">Subtotal</dt>
                                <dd className="font-medium">{formatPrice(order.subTotal)}</dd>
                            </div>

                            <div className="flex justify-between gap-3">
                                <dt className="text-neutral-500">Shipping fee</dt>
                                <dd className="font-medium">{formatPrice(order.shippingFee)}</dd>
                            </div>

                            {order.shippingDiscount > 0 && (
                                <div className="flex justify-between gap-3 text-green-700">
                                    <dt>
                                        Shipping discount
                                        {order.shippingDiscount >= order.shippingFee && " (free shipping)"}
                                    </dt>
                                    <dd className="font-medium">−{formatPrice(order.shippingDiscount)}</dd>
                                </div>
                            )}

                            <div className="flex justify-between gap-3 border-t border-gray-200 pt-3 text-base">
                                <dt className="font-semibold">Total</dt>
                                <dd className="font-bold text-neutral-900">{formatPrice(order.total)}</dd>
                            </div>
                        </dl>
                    </Section>
                </div>
            </div>
        </div>
    );
}
