import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { getErrorMessage } from "../../api/client";
import HomeLayout from "../../layouts/HomeLayout";
import Skeleton from "../../components/ui/Skeleton";
import StatusBadge from "../../components/orders/StatusBadge";
import ConfirmDeleteModal from "../../components/ConfirmModal";
import { useCancelOrder, useMyOrder } from "../../queries/orders";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { formatDate, formatPrice } from "../../lib/format";
import { MoveLeft } from "lucide-react";

export default function OrderDetails() {
    const { id } = useParams();
    const { data: order, isPending, error } = useMyOrder(id);
    const cancel = useCancelOrder();
    const [confirmOpen, setConfirmOpen] = useState(false);

    useDocumentTitle(order ? `Order ${order.orderNumber}` : "Order");

    function handleCancel() {
        cancel.mutate(order.id, {
            onSuccess: () => {
                toast.success("Order cancelled");
                setConfirmOpen(false);
            },
            onError: (err) => {
                toast.error(getErrorMessage(err));
                setConfirmOpen(false);
            },
        });
    }

    if (isPending) {
        return (
            <HomeLayout>
                <div role="status" className="space-y-4">
                    <span className="sr-only">Loading your order…</span>
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-48" />
                    <Skeleton className="h-32" />
                </div>
            </HomeLayout>
        );
    }

    if (error || !order) {
        return (
            <HomeLayout>
                <div role="alert" className="rounded-md bg-red-50 p-4 text-sm text-red-600">
                    {error ? getErrorMessage(error) : "Order not found."}{" "}
                    <Link to="/orders" className="font-semibold underline">
                        Back to my orders
                    </Link>
                </div>
            </HomeLayout>
        );
    }

    const canCancel = order.status === "Pending" && order.payment?.paymentStatus !== "Paid";
    const address = order.address;

    return (
        <HomeLayout>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-3">
                        <Link to="/profile?tab=history" className="group flex size-11 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white text-neutral-900 transition-colors duration-200 hover:border-accent-100 hover:bg-accent-50 hover:text-accent-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-100">
                            <MoveLeft size={20} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
                        </Link>
                        <h1 className="text-3xl font-bold text-heading">Order {order.orderNumber}</h1>
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">Placed on {formatDate(order.orderDate)}</p>
                </div>
                <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    {canCancel && (
                        <button
                            type="button"
                            onClick={() => setConfirmOpen(true)}
                            className="rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                            Cancel order
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_340px]">
                <section className="rounded-md border border-gray-300 bg-white px-5">
                    <h2 className="border-b border-gray-200 py-4 font-bold text-heading">
                        Items ({order.items.length})
                    </h2>
                    <ul className="divide-y divide-gray-200">
                        {order.items.map((item) => (
                            <li key={item.productId} className="flex gap-4 py-4">
                                <Link
                                    to={`/products/${item.productId}`}
                                    className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-300"
                                >
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-contain p-1" />
                                    ) : (
                                        <span className="text-xs text-neutral-500">No image</span>
                                    )}
                                </Link>
                                <div className="min-w-0 flex-1">
                                    <Link
                                        to={`/products/${item.productId}`}
                                        className="line-clamp-2 font-semibold text-heading hover:text-accent-100"
                                    >
                                        {item.productName}
                                    </Link>
                                    <p className="mt-0.5 text-sm text-neutral-500">
                                        {formatPrice(item.unitPrice)} x {item.quantity}
                                    </p>
                                </div>
                                <p className="shrink-0 font-bold text-heading">{formatPrice(item.subTotal)}</p>
                            </li>
                        ))}
                    </ul>
                </section>

                <div className="space-y-6">
                    <section className="rounded-md border border-gray-300 bg-white p-5">
                        <h2 className="font-bold text-heading">Delivery address</h2>
                        <p className="mt-3 text-sm font-semibold text-heading">{address.recipientName}</p>
                        <p className="mt-0.5 text-sm text-neutral-500">{address.contactNumber}</p>
                        <p className="mt-1 text-sm text-neutral-500">
                            {address.addressLine}, {address.barangay}, {address.city}, {address.province} {address.postalCode}
                        </p>
                    </section>

                    {order.payment && (
                        <section className="rounded-md border border-gray-300 bg-white p-5">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="font-bold text-heading">Payment</h2>
                                <StatusBadge status={order.payment.paymentStatus} />
                            </div>
                            <p className="mt-3 text-sm text-neutral-500">Method: {order.payment.paymentMethod}</p>
                            <p className="mt-1 break-all text-xs text-neutral-500">Ref: {order.payment.transactionReference}</p>
                        </section>
                    )}

                    <section className="rounded-md border border-gray-300 bg-white p-5">
                        <h2 className="font-bold text-heading">Order Summary</h2>
                        <dl className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-neutral-500">Subtotal</dt>
                                <dd className="font-medium">{formatPrice(order.subTotal)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-neutral-500">Shipping fee</dt>
                                <dd className="font-medium">{formatPrice(order.shippingFee)}</dd>
                            </div>
                            {order.shippingDiscount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <dt>
                                        Shipping discount
                                        {order.shippingDiscount >= order.shippingFee && " (free shipping)"}
                                    </dt>
                                    <dd className="font-medium">−{formatPrice(order.shippingDiscount)}</dd>
                                </div>
                            )}
                            <div className="flex justify-between border-t border-gray-200 pt-3 text-base">
                                <dt className="font-semibold">Total</dt>
                                <dd className="font-bold text-heading">{formatPrice(order.total)}</dd>
                            </div>
                        </dl>
                    </section>
                </div>
            </div>

            {confirmOpen && (
                <ConfirmDeleteModal
                    title="Cancel this order?"
                    message="Your items will be returned to stock. This can't be undone."
                    confirmLabel="Cancel order"
                    cancelLabel="Keep order"
                    loadingLabel="Cancelling…"
                    loading={cancel.isPending}
                    onConfirm={handleCancel}
                    onClose={() => setConfirmOpen(false)}
                />
            )}
        </HomeLayout>
    );
}