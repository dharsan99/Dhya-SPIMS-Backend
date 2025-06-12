-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE');

-- CreateTable
CREATE TABLE "raw_cotton_composition" (
    "id" UUID NOT NULL,
    "shade_id" UUID NOT NULL,
    "lot_number" TEXT,
    "percentage" INTEGER NOT NULL,
    "stock_kg" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "grade" TEXT,
    "source" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_cotton_composition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "token_no" TEXT NOT NULL,
    "shift_rate" DECIMAL(10,2) NOT NULL,
    "aadhar_no" TEXT NOT NULL,
    "bank_acc_1" TEXT NOT NULL,
    "bank_acc_2" TEXT,
    "department" TEXT,
    "join_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailingList" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailingListBuyer" (
    "id" TEXT NOT NULL,
    "mailingListId" UUID NOT NULL,
    "buyerId" UUID NOT NULL,

    CONSTRAINT "MailingListBuyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "recipients" TEXT[],

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "shift" TEXT NOT NULL,
    "overtime_hours" DOUBLE PRECISION NOT NULL,
    "total_hours" DOUBLE PRECISION NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "employee_id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PotentialBuyer" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "person" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PotentialBuyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailingListRecipient" (
    "id" UUID NOT NULL,
    "mailingListId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailingListRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "po_number" TEXT NOT NULL,
    "po_date" TIMESTAMP(3),
    "buyer_name" TEXT NOT NULL,
    "buyer_contact_name" TEXT,
    "buyer_contact_phone" TEXT,
    "buyer_email" TEXT,
    "buyer_address" TEXT,
    "buyer_gst_no" TEXT,
    "buyer_pan_no" TEXT,
    "supplier_name" TEXT,
    "supplier_gst_no" TEXT,
    "payment_terms" TEXT,
    "style_ref_no" TEXT,
    "delivery_address" TEXT,
    "tax_details" JSONB,
    "grand_total" DECIMAL(12,2) NOT NULL,
    "amount_in_words" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "order_code" TEXT,
    "yarn_description" TEXT NOT NULL,
    "color" TEXT,
    "count" INTEGER,
    "uom" TEXT,
    "bag_count" INTEGER,
    "quantity" DECIMAL(10,2) NOT NULL,
    "rate" DECIMAL(10,2) NOT NULL,
    "gst_percent" DECIMAL(4,2),
    "taxable_amount" DECIMAL(12,2) NOT NULL,
    "shade_no" TEXT,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "raw_cotton_composition_shade_id_lot_number_key" ON "raw_cotton_composition"("shade_id", "lot_number");

-- CreateIndex
CREATE UNIQUE INDEX "employees_token_no_key" ON "employees"("token_no");

-- CreateIndex
CREATE UNIQUE INDEX "employees_aadhar_no_key" ON "employees"("aadhar_no");

-- CreateIndex
CREATE UNIQUE INDEX "MailingListBuyer_mailingListId_buyerId_key" ON "MailingListBuyer"("mailingListId", "buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_date_employee_id_key" ON "Attendance"("date", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "PotentialBuyer_email_key" ON "PotentialBuyer"("email");

-- CreateIndex
CREATE INDEX "MailingListRecipient_mailingListId_idx" ON "MailingListRecipient"("mailingListId");

-- AddForeignKey
ALTER TABLE "raw_cotton_composition" ADD CONSTRAINT "raw_cotton_composition_shade_id_fkey" FOREIGN KEY ("shade_id") REFERENCES "shades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailingListBuyer" ADD CONSTRAINT "MailingListBuyer_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "buyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailingListBuyer" ADD CONSTRAINT "MailingListBuyer_mailingListId_fkey" FOREIGN KEY ("mailingListId") REFERENCES "MailingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailingListRecipient" ADD CONSTRAINT "MailingListRecipient_mailingListId_fkey" FOREIGN KEY ("mailingListId") REFERENCES "MailingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
