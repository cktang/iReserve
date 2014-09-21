package kin.apple;

import java.net.InetSocketAddress;
import java.util.ArrayList;
import java.util.List;

import org.apache.log4j.Logger;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import com.google.gson.Gson;

public class WebServer extends WebSocketServer {
	private static final Logger logger = Logger.getLogger(WebServer.class);

	private List<WebSocket> sockets = new ArrayList<WebSocket>();

	public WebServer(InetSocketAddress address) {
		super(address);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void onClose(WebSocket arg0, int arg1, String arg2, boolean arg3) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void onError(WebSocket arg0, Exception arg1) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void onMessage(WebSocket arg0, String arg1) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void onOpen(WebSocket arg0, ClientHandshake arg1) {
		this.sockets .add(arg0);
	}

	public void broadcast(Object object) {
		this.broadcast(new Gson().toJson(object));
	}
	
	public void broadcast(String message) {
		logger.info("Broadcast: " + message);
		
		for (WebSocket socket: this.sockets) {
			try {
				socket.send(message);
			} catch(Exception e) {
				
			}
		}
	}
	
}
