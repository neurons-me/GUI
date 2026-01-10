import React from "react";
import ReactDOM from "react-dom/client";
import { GuiProvider, Button, Box, Typography } from "this.gui";
import "this.gui/style.css";

function Demo() {
  return (
    <GuiProvider theme="dark">
      <Box sx={{ minHeight: "100vh", p: 4, display: "grid", placeItems: "center" }}>
        <Box sx={{ textAlign: "center", display: "grid", gap: 2 }}>
          <Typography variant="h3">this.GUI</Typography>
          <Typography variant="body1" sx={{ opacity: 0.8 }}>
            Demo running locally ✅
          </Typography>
          <Button variant="contained">Start Building</Button>
        </Box>
      </Box>
    </GuiProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<Demo />);