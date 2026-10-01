import { useEffect, useMemo, useState } from "react";
import { makeApi, modelApi } from "@/services";
import { extractList } from "@/utils/apiResponse";

let makesPromise = null;

function loadMakes() {
  if (!makesPromise) {
    makesPromise = makeApi
      .getAll({})
      .then((response) => extractList(response, makeApi.listKey))
      .catch(() => {
        // Don't cache a failure - let the next mount retry.
        makesPromise = null;
        return [];
      });
  }
  return makesPromise;
}

export function useMakeModelOptions(makeName, modelName) {
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);

  // Shared across every caller - see loadMakes above.
  useEffect(() => {
    let cancelled = false;
    loadMakes().then((rows) => {
      if (!cancelled) setMakes(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const makeOptions = useMemo(
    () =>
      makes.map((m) => ({ value: m.makeName, label: m.makeName, id: m.id })),
    [makes],
  );

  const makeId = useMemo(
    () => makeOptions.find((m) => m.value === makeName)?.id ?? null,
    [makeOptions, makeName],
  );

  // Models reload whenever the make changes.
  useEffect(() => {
    if (!makeId) {
      setModels([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await modelApi.getForMake(makeId);
        if (!cancelled)
          setModels(extractList(response, modelApi.listKey, "ModelData"));
      } catch {
        if (!cancelled) setModels([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [makeId]);

  const modelOptions = useMemo(
    () =>
      models.map((m) => ({
        value: m.modelName,
        label: m.modelName,
        id: m.id,
        segment: m.segment ?? "", // getModelsByMake -> "A".."E"
      })),
    [models],
  );
  const modelId = useMemo(
    () => modelOptions.find((m) => m.value === modelName)?.id ?? null,
    [modelOptions, modelName],
  );

  return { makeOptions, modelOptions, makeId, modelId };
}
