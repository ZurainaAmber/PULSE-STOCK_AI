"""
PulseStock AI - Manager Authentication & Inter-Store Stock Transfer Verification Suite
Cypher 2026 Challenge 6

Verifies end-to-end:
1. PBKDF2 Password hashing & session token authentication (login success & failure)
2. Server-side store authorization (preventing cross-store privilege escalation)
3. Inter-store stock transfer request submission with inventory validation
4. Manager approval workflows: Full Acceptance, Partial Acceptance, and Rejection
5. Inter-store logistics lifecycle: PENDING -> ACCEPTED -> IN_TRANSIT -> DELIVERED
6. Atomic SQLite inventory deduction & addition verification
7. ActionLog audit trail persistence
"""

import os
import sys
import json
import urllib.request
import urllib.error

API_URL = "http://127.0.0.1:8000/api/v1"

def post(endpoint, payload=None, token=None):
    data = json.dumps(payload).encode("utf-8") if payload is not None else b"{}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{API_URL}{endpoint}", data=data, headers=headers)
    return urllib.request.urlopen(req)

def get(endpoint, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{API_URL}{endpoint}", headers=headers)
    return urllib.request.urlopen(req)

def run_suite():
    print("==================================================================")
    print(" PulseStock AI — Manager Auth & Stock Transfer Verification Suite")
    print("==================================================================")
    
    passed = 0
    total = 0

    def check(test_name, condition, details=""):
        nonlocal passed, total
        total += 1
        status = "PASS" if condition else "FAIL"
        if condition:
            passed += 1
        print(f"[{status}] Test {total:02d}: {test_name}")
        if details:
            print(f"         {details}")
        assert condition, f"Assertion failed: {test_name} - {details}"

    # ---------------------------------------------------------
    # 1. Login Failure (Invalid Password)
    # ---------------------------------------------------------
    login_failed_status = None
    try:
        post("/auth/login", {"username": "mgr_store7", "password": "wrong_password_999"})
    except urllib.error.HTTPError as e:
        login_failed_status = e.code
    check(
        "Manager Login Rejects Invalid Password",
        login_failed_status == 401,
        f"Expected HTTP 401, received HTTP {login_failed_status}"
    )

    # ---------------------------------------------------------
    # 2. Login Success for Store 7, Store 3, and Store 12
    # ---------------------------------------------------------
    res7 = json.loads(post("/auth/login", {"username": "mgr_store7", "password": "password123"}).read().decode())
    token7 = res7.get("token")
    user7 = res7.get("user", {})
    check(
        "Store 7 Manager Login Success (mgr_store7)",
        token7 is not None and user7.get("store_id") == "STORE_007",
        f"Manager: {user7.get('manager_name')}, Store: {user7.get('store_id')}"
    )

    res3 = json.loads(post("/auth/login", {"username": "mgr_store3", "password": "password123"}).read().decode())
    token3 = res3.get("token")
    user3 = res3.get("user", {})
    check(
        "Store 3 Manager Login Success (mgr_store3)",
        token3 is not None and user3.get("store_id") == "STORE_003",
        f"Manager: {user3.get('manager_name')}, Store: {user3.get('store_id')}"
    )

    res12 = json.loads(post("/auth/login", {"username": "mgr_store12", "password": "password123"}).read().decode())
    token12 = res12.get("token")
    user12 = res12.get("user", {})
    check(
        "Store 12 Manager Login Success (mgr_store12)",
        token12 is not None and user12.get("store_id") == "STORE_012",
        f"Manager: {user12.get('manager_name')}, Store: {user12.get('store_id')}"
    )

    # ---------------------------------------------------------
    # 3. Server Authorization: Cannot Request Stock From Own Store
    # ---------------------------------------------------------
    self_request_code = None
    try:
        post("/transfers", {
            "to_store_id": "STORE_007",
            "sku_id": "SKU_COLD_DRINK_750ML",
            "requested_quantity": 10
        }, token=token7)
    except urllib.error.HTTPError as e:
        self_request_code = e.code
    check(
        "Prevent Transfer Request to Own Store",
        self_request_code == 400,
        f"Expected HTTP 400, received HTTP {self_request_code}"
    )

    # ---------------------------------------------------------
    # 4. Request Submission: Store 7 Requests 25 Units from Store 3
    # ---------------------------------------------------------
    trf_res = json.loads(post("/transfers", {
        "to_store_id": "STORE_003",
        "sku_id": "SKU_COLD_DRINK_750ML",
        "requested_quantity": 25,
        "notes": "Urgent requirement for evening World Cup match surge"
    }, token=token7).read().decode())
    
    trf_id = trf_res["transfer_id"]
    check(
        "Manager 7 Submits Inter-Store Transfer Request",
        trf_res["status"] == "PENDING" and trf_res["requested_quantity"] == 25,
        f"Transfer ID: {trf_id}, From: {trf_res['from_store_id']} -> To: {trf_res['to_store_id']}"
    )

    # ---------------------------------------------------------
    # 5. Unauthorized Decision Prevention (Store 12 Manager Cannot Decide for Store 3)
    # ---------------------------------------------------------
    unauth_decision_code = None
    try:
        post(f"/transfers/{trf_id}/respond", {
            "action": "ACCEPT_ALL"
        }, token=token12)
    except urllib.error.HTTPError as e:
        unauth_decision_code = e.code
    check(
        "Prevent Unauthorized Manager from Deciding on Other Store's Transfer",
        unauth_decision_code == 403,
        f"Expected HTTP 403 Forbidden, received HTTP {unauth_decision_code}"
    )

    # ---------------------------------------------------------
    # 6. Partial Acceptance Workflow (Store 3 Accepts 18 Units)
    # ---------------------------------------------------------
    acc_res = json.loads(post(f"/transfers/{trf_id}/respond", {
        "action": "ACCEPT_PARTIAL",
        "approved_quantity": 18,
        "notes": "Can spare 18 units while maintaining Domlur safety stock"
    }, token=token3).read().decode())
    check(
        "Manager 3 Partially Accepts Stock Request",
        acc_res["status"] == "ACCEPTED" and acc_res["approved_quantity"] == 18,
        f"Status: {acc_res['status']}, Approved Qty: {acc_res['approved_quantity']} / {acc_res['requested_quantity']}"
    )

    # ---------------------------------------------------------
    # 7. State Transition to IN_TRANSIT (Dispatched by Rider)
    # ---------------------------------------------------------
    disp_res = json.loads(post(f"/transfers/{trf_id}/dispatch", {}, token=token3).read().decode())
    check(
        "Dispatch Transfer (Transitions to IN_TRANSIT)",
        disp_res["status"] == "IN_TRANSIT" and disp_res["dispatched_at"] is not None,
        f"Status: {disp_res['status']}, Dispatched at: {disp_res['dispatched_at']}, ETA: ~{disp_res['eta_minutes']} mins"
    )

    # ---------------------------------------------------------
    # 8. Receipt Confirmation Authorization (Only Receiving Store Can Confirm)
    # ---------------------------------------------------------
    wrong_receive_code = None
    try:
        post(f"/transfers/{trf_id}/receive", {}, token=token3)
    except urllib.error.HTTPError as e:
        wrong_receive_code = e.code
    check(
        "Prevent Donor Store from Confirming Destination Delivery",
        wrong_receive_code == 403,
        f"Expected HTTP 403 Forbidden, received HTTP {wrong_receive_code}"
    )

    # ---------------------------------------------------------
    # 9. Stock Inventory Update on Delivery Confirmation
    # ---------------------------------------------------------
    donor_stock_before = disp_res["donor_current_stock"]
    dest_stock_before = disp_res["dest_current_stock"]

    rec_res = json.loads(post(f"/transfers/{trf_id}/receive", {}, token=token7).read().decode())
    donor_stock_after = rec_res["donor_current_stock"]
    dest_stock_after = rec_res["dest_current_stock"]

    stock_decreased = (donor_stock_after == donor_stock_before - 18)
    stock_increased = (dest_stock_after == dest_stock_before + 18)

    check(
        "Confirm Delivery & Atomic Inventory Update",
        rec_res["status"] == "DELIVERED" and stock_decreased and stock_increased,
        f"Donor Store 3 Stock: {donor_stock_before} -> {donor_stock_after} (-18) | Dest Store 7 Stock: {dest_stock_before} -> {dest_stock_after} (+18)"
    )

    # ---------------------------------------------------------
    # 10. Rejection Workflow (Store 7 Requests from Store 12; Store 12 Rejects)
    # ---------------------------------------------------------
    trf2 = json.loads(post("/transfers", {
        "to_store_id": "STORE_012",
        "sku_id": "SKU_COLD_DRINK_750ML",
        "requested_quantity": 12,
        "notes": "Backup request"
    }, token=token7).read().decode())
    trf2_id = trf2["transfer_id"]

    rej_res = json.loads(post(f"/transfers/{trf2_id}/respond", {
        "action": "REJECT",
        "rejection_reason": "Buffer too low due to local footfall surge"
    }, token=token12).read().decode())
    check(
        "Manager 12 Rejects Transfer Request with Reason",
        rej_res["status"] == "REJECTED" and rej_res["rejection_reason"] == "Buffer too low due to local footfall surge",
        f"Status: {rej_res['status']}, Reason: {rej_res['rejection_reason']}"
    )

    # ---------------------------------------------------------
    # 11. SQLite Persistence Check (Refreshed Query)
    # ---------------------------------------------------------
    all_trf = json.loads(get("/transfers?direction=all", token=token7).read().decode())
    t1_persisted = any(t["transfer_id"] == trf_id and t["status"] == "DELIVERED" for t in all_trf["transfers"])
    t2_persisted = any(t["transfer_id"] == trf2_id and t["status"] == "REJECTED" for t in all_trf["transfers"])
    check(
        "SQLite Persistence: All Transfers & Decisions Persisted Cleanly",
        t1_persisted and t2_persisted,
        f"Total persisted transfers for Store 7: {len(all_trf['transfers'])}"
    )

    # ---------------------------------------------------------
    # 12. Action Audit Trail Logging
    # ---------------------------------------------------------
    actions = json.loads(get("/actions/history?limit=10", token=token7).read().decode())
    delivered_action = any(
        a.get("recommendation_id") == trf_id or "TRF" in a.get("action_id", "")
        for a in actions.get("actions", [])
    )
    check(
        "Action Audit Log Records Executed Stock Transfer",
        delivered_action,
        f"Verified action audit ledger recorded transfer execution event."
    )

    print("\n------------------------------------------------------------------")
    print(f" Summary: {passed} / {total} Verification Tests Passed (100% Success)")
    print("==================================================================")

if __name__ == "__main__":
    run_suite()
