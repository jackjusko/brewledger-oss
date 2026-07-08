package com.getbrewledger.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;
import android.webkit.WebView; // <--- ADD THIS IMPORT

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Prevent system nav bar (3-button / gesture area) from overlapping your WebView UI
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
	
	if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
		WebView.setWebContentsDebuggingEnabled(true);
	}
		
		
  }
}
