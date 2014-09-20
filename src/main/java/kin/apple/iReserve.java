package kin.apple;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.net.URL;
import java.net.URLConnection;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;

import javax.sound.sampled.AudioFormat;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.DataLine;
import javax.sound.sampled.LineUnavailableException;
import javax.sound.sampled.SourceDataLine;

import org.apache.log4j.Logger;

import scala.Option;
import scala.Some;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.stream.JsonReader;
 
public class iReserve implements Runnable {
	private static final Logger logger = Logger.getLogger(iReserve.class);
	Gson gson = new GsonBuilder().setPrettyPrinting().create();

	static final String availabilityURL = "https://reserve.cdn-apple.com/HK/zh_HK/reserve/iPhone/availability.json";
	static final String registerURL = "https://signin.apple.com/IDMSWebAuth/login?path=%2FHK%2Fzh_HK%2Freserve%2FiPhone%3Fexecution%3De1s1%26p_left%3DAAAAAAT8lVE%252BD118XhhpDYCifP4KvPC4vY%252Fq8XxUxdiiHaKDDw%253D%253D%26_eventId%3Dnext&p_time=1411212324&rv=3&language=HK-ZH&p_left=AAAAAAT8lVE%2BD118XhhpDYCifP4KvPC4vY%2Fq8XxUxdiiHaKDDw%3D%3D&appIdKey=db0114b11bdc2a139e5adff448a1d7325febef288258f0dc131d6ee9afe63df3";
	static final String register0URL = "https://reserve-hk.apple.com/HK/zh_HK/reserve/iPhone?execution=e2s1";
	static final String[] i6Plus = new String[] {
		"MGA92ZP/A", "MGAJ2ZP/A", "MGAE2ZP/A"
	};
	
	class Availability {
		HashMap<String, Boolean> R485;
		HashMap<String, Boolean> R409;
		HashMap<String, Boolean> R428;
		long updated;
		
		boolean isAvaialble() {
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
	
	public iReserve() throws Exception {
		logger.info("iReserve()");
	}
	
	public void playSiren() {

		int BUFFER_SIZE = 128000;
		File soundFile = null;
		AudioInputStream audioStream = null;
		AudioFormat audioFormat;
		SourceDataLine sourceLine = null;

		String strFilename = "siren1.wav";

		try {
			soundFile = new File(strFilename);
		} catch (Exception e) {
			e.printStackTrace();
			System.exit(1);
		}

		try {
			audioStream = AudioSystem.getAudioInputStream(soundFile);
		} catch (Exception e) {
			e.printStackTrace();
			System.exit(1);
		}

		audioFormat = audioStream.getFormat();

		DataLine.Info info = new DataLine.Info(SourceDataLine.class,
				audioFormat);
		try {
			sourceLine = (SourceDataLine) AudioSystem.getLine(info);
			sourceLine.open(audioFormat);
		} catch (LineUnavailableException e) {
			e.printStackTrace();
			System.exit(1);
		} catch (Exception e) {
			e.printStackTrace();
			System.exit(1);
		}

		sourceLine.start();

		int nBytesRead = 0;
		byte[] abData = new byte[BUFFER_SIZE];
		while (nBytesRead != -1) {
			try {
				nBytesRead = audioStream.read(abData, 0, abData.length);
			} catch (IOException e) {
				e.printStackTrace();
			}
			if (nBytesRead >= 0) {
				@SuppressWarnings("unused")
				int nBytesWritten = sourceLine.write(abData, 0, nBytesRead);
			}
		}

		sourceLine.drain();
		sourceLine.close();
	}
	
	public Option<Availability> getAvailability(String url) {
		String json;
		Availability a = null;
		try {
			json = this.getJSON(url);			
			JsonReader reader = new JsonReader(new StringReader(json));
			reader.setLenient(true);
			a = gson.fromJson(reader, Availability.class);
			
			//just for testing
			a.R409.put(iReserve.i6Plus[0], true);
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		return new Some<Availability>(a);
	}
	
	public String getJSON(String urlString) throws Exception {
		logger.debug("getJSON: " + urlString);
		
		final URL url = new URL(urlString);
		final URLConnection urlConnection = url.openConnection();
		urlConnection.setDoOutput(true);
		urlConnection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
		urlConnection.connect();

		final InputStream inputStream = urlConnection.getInputStream();
		byte[] jsonByte = new byte[10000];
		inputStream.read(jsonByte);
		
		String json = new String(jsonByte, "UTF-8");		
		logger.debug("JSON: " + json);
		return json;
	}
	
	public void run() {
		DateFormat formatter = new SimpleDateFormat("HH:mm:ss:SSS");

		while(true) {
			try {
				Thread.sleep(500);
			} catch (InterruptedException e) {}

			//get status
			try {
				Option<Availability> a = this.getAvailability(iReserve.availabilityURL);
				if (a instanceof Some) {
					
					if (a.get().isAvaialble()) {
						String storeName = a.get().getStoreName();
						logger.info("AVAIABLE: " + storeName);
						this.playSiren();
						this.register();
						
						Thread.sleep(60 * 1000);
						
						//open safari to login
					} else {
						logger.info("Now:" + new Date() + " Update:" + formatter.format(a.get().getDate()));
					}					
				} else {
					logger.info("Apple site not available");
				}
			} catch (Exception e1) {
				// TODO Auto-generated catch block
				e1.printStackTrace();
			}	
		}
	}
	
	public void register() {
		try {
//			WebClient webClient = new WebClient(BrowserVersion.CHROME);
//			HtmlPage page = webClient.getPage(iReserve.registerURL);
//			List<HtmlElement> elements;
//			
//			page.getElementByName("appleId").setNodeValue(iReserve.appleId);
//			page.getElementByName("accountPassword").setNodeValue(iReserve.appleIdPassword);
//			
//			
//			webClient.closeAllWindows();
//			

			Runtime.getRuntime().exec("open " + iReserve.register0URL);
			
		}catch (Exception e) {
			e.printStackTrace();
		}
	}
	

	public static void main(String args[]) throws Exception {
		new Thread(new iReserve()).start(); 
	}
}