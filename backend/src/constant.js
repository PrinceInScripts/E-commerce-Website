
export const DB_NAME="e-commerce"

export const userRolesEnum={
    ADMIN:"ADMIN",
    USER:"USER"
}

export const AvailableUserRoles=Object.values(userRolesEnum)

export const orderStatusEnum={
    PENDING:"PENDING",
    CANCELLED:"CANCELLED",
    DELIVERED:"DELIVERED",
}

export const AvailableOrderStatus=Object.values(orderStatusEnum)

export const PaymentProviderEnum={
    UNKNOWN:"UNKNOWN",
    RAZORPAY:"RAZORPAY",
    PAYPAL:"PAYPAL",
}

export const AvailablePaymentProvider=Object.values(PaymentProviderEnum)

export const CoupenTypeEnum = {
    FLAT:"FLAT",
}

export const AvailableCouponType=Object.values(CoupenTypeEnum)

export const userLoginType={
    GOOGLE:"GOOGLE",
    GITHUB:"GITHUB",
    EMAIL_PASSWORD:"EMAIL_PASSWORD",
}

export const AvailableUserLoginType=Object.values(userLoginType)

export const USER_TEMPORARY_TOKEN_EXPIRY = 20 * 60 * 1000; // 20 minutes