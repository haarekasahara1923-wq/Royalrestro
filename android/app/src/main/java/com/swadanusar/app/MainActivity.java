package com.swadanusar.app;

import android.webkit.CookieManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onPause() {
        super.onPause();
        CookieManager.getInstance().flush();
    }
}
