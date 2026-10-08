import * as React from "react";
import type { RegistryEntry } from "@/Registry/types";
import CleakerUser, { type CleakerUserProps } from "./CleakerUser";

type CleakerUserSpec = {
  type: "CleakerUser";
  props?: CleakerUserProps;
};

export const meta = {
  id: "components.identity-noise.cleaker-user",
  type: "CleakerUser",
  label: "Cleaker User",
  group: "Components",
  path: ["Identity Noise", "Cleaker", "User"],
  tags: ["cleaker", "user", "profile", "me"],
  demoSpec: {
    type: "CleakerUser",
    props: {
      username: "oscar-wilde",
      rootNamespace: "cleaker.me",
    },
  },
} as const;

const CleakerUserResolver: RegistryEntry = {
  type: "CleakerUser",
  resolve(spec: CleakerUserSpec) {
    const props = spec.props ?? {};
    return <CleakerUser {...props} />;
  },
};

export default CleakerUserResolver;
