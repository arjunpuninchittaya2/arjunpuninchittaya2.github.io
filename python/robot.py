import OTOS
import time
import RPi.GPIO as GPIO

class Robot:
    def __init__(self):
        self.otos = OTOS.OTOS()
        self.target_pose = None
        GPIO.setmode(GPIO.BCM)
        self.motor_controller = DualMotorController()
        
    def read_sensors(self):
        return self.otos.read_x(), self.otos.read_y(), self.otos.read_heading()
        
    def drive_to_target(self):
        while self.target_pose:
            x, y, r = self.read_sensors()
            command = self.calculate_command(x, y, r)
            self.execute_command(command)
            time.sleep(0.1)

    def calculate_command(self, x, y, r):
        # Implement command calculation logic
        pass

    def execute_command(self, command):
        # Implement command execution and clamping
        pass

    def move_forward(self, power):
        self.motor_controller.set_motor_power(power, power)
    
    def turn_right(self):
        self.motor_controller.set_motor_power(-power, power)
    
    def halt(self):
        self.motor_controller.set_motor_power(0, 0)

class DualMotorController:
    def __init__(self):
        GPIO.setup(6, GPIO.OUT)  # Motor A PWM
        GPIO.setup(12, GPIO.OUT)  # Motor A direction
        GPIO.setup(5, GPIO.OUT)  # Motor B PWM
        GPIO.setup(13, GPIO.OUT)  # Motor B direction
        self.pwm_a = GPIO.PWM(6, 100)
        self.pwm_b = GPIO.PWM(5, 100)
        self.pwm_a.start(0)
        self.pwm_b.start(0)

    def set_motor_power(self, power_a, power_b):
        self.pwm_a.ChangeDutyCycle(min(max(0, power_a), 35))
        self.pwm_b.ChangeDutyCycle(min(max(0, power_b), 35))
        
    def cleanup(self):
        GPIO.cleanup()

if __name__ == '__main__':
    try:
        robot = Robot()
        robot.drive_to_target()
    except Exception as e:
        print(f'Error: {e}')
        robot.motor_controller.cleanup()