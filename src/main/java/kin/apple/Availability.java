package kin.apple;

import java.util.Date;
import java.util.HashMap;

class Availability {
	HashMap<String, Boolean> R485;
	HashMap<String, Boolean> R409;
	HashMap<String, Boolean> R428;
	long updated;
	
	boolean isAvaialble() {
		if (updated == 0) return false;
		
		for (String model: iReserve.i6Plus) {
			if (R485.get(model) || R409.get(model) || R428.get(model)) return true;
		}
		return false;
	}
	
	String getStoreName() {
		for (String model: iReserve.i6Plus) {
			if (R485.get(model)) return "R485";
			if (R409.get(model)) return "R409"; 
			if (R428.get(model)) return "R428";
		}
		return "";
	}
	
	Date getDate() {
		return new Date(this.updated);
	}
}