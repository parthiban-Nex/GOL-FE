import { modelApi, pincodeApi, vehicleApi } from "@/services";
import { extractList } from "@/utils/apiResponse";

/**
 * customerState + modelSegment for POST /serviceEstimate/getEstimateLineItemDetails
 * (Add in Estimate Step 2 and Job Card Step 3), in this order:
 *  1. already known on the customer (profile state / chosen model's segment)
 *  2. existing vehicle: POST /vehicle/getVehicleDetailsByRegNo
 *  3. new vehicle: the selected model's segment (POST /models/getModelsByMake)
 *  4. state from the pincode: POST /vendors/getPincodeData
 *
 * `cache` (an object the caller keeps) stops repeat lookups within a session.
 */
export async function resolveLineItemContext(customer = {}, cache = {}) {
  const cached = async (key, load) => {
    if (cache[key] === undefined) {
      try {
        cache[key] = await load();
      } catch {
        cache[key] = null;
      }
    }
    return cache[key];
  };

  let customerState = customer.customerState || "";
  let modelSegment = customer.modelSegment || "";

  const regNo = String(customer.regNo ?? "").trim();
  if ((!customerState || !modelSegment) && regNo) {
    const match = await cached(`regno-${regNo.toUpperCase()}`, async () => {
      const res = await vehicleApi.getByRegNo(regNo);
      return res?.requestSuccessful ? (res.vehicleData?.[0] ?? null) : null;
    });
    if (match) {
      customerState ||= match.customerState || match.customerData?.state || "";
      modelSegment ||= match.modelSegment || "";
    }
  }

  if (!modelSegment && customer.makeId && customer.modelId) {
    modelSegment =
      (await cached(
        `model-${customer.makeId}-${customer.modelId}`,
        async () => {
          const res = await modelApi.getForMake(customer.makeId);
          const model = extractList(res, modelApi.listKey, "ModelData").find(
            (m) => String(m.id) === String(customer.modelId),
          );
          return model?.segment ?? "";
        },
      )) || "";
  }

  const pin = String(customer.pincode ?? "").trim();
  if (!customerState && /^\d{6}$/.test(pin)) {
    customerState =
      (await cached(`pin-${pin}`, async () => {
        const res = await pincodeApi.lookup(pin);
        return res?.requestSuccessful ? (res.pincodeData?.state ?? "") : "";
      })) || "";
  }

  return { customerState, modelSegment };
}
