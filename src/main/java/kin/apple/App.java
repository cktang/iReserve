package kin.apple;
import java.awt.Component;
import java.awt.Container;

import javax.swing.BoxLayout;
import javax.swing.JComponent;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JTextField;
import javax.swing.border.EmptyBorder;

public class App {
	
	private static final JTextField captcha = new JTextField("");
	private static final JTextField sms = new JTextField("");

	public static void addComponentsToPane(Container pane) {
        pane.setLayout(new BoxLayout(pane, BoxLayout.Y_AXIS));
 
        add(new JLabel("Captcha"), pane);
        add(new ImagePanel(), pane);
        add(captcha, pane);
        
        add(new JLabel("SMS"), pane);
        add(sms, pane);
    }
 
    private static void add(Component obj, Container container) {
        container.add(obj);
    }
    
    private static void createAndShowGUI() {
        //Create and set up the window.
        JFrame frame = new JFrame("BoxLayoutDemo");
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        ((JComponent) frame.getContentPane()).setBorder(new EmptyBorder(10, 10, 10, 10) );
 
        //Set up the content pane.
        addComponentsToPane(frame.getContentPane());
 
        //Display the window.
        frame.pack();
        frame.setVisible(true);
    }
 
    public static void main(String[] args) throws Exception {
		new Thread(new iReserve()).start(); 
    	
        javax.swing.SwingUtilities.invokeLater(new Runnable() {
            public void run() {
                createAndShowGUI();
            }
        });
    }
}