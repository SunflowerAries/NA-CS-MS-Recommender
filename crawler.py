from enum import Enum
import requests, csv, string

# need to set
token = 'd0301e67f6b4d48794fb58577e95179280958ec7'
base_url = 'https://search.prtl.co/2018-07-23/?start='
base_url0 = 'https://reflector.prtl.co/?length=0&include_order=false&token=' + token + '&q=id-'
header = ['name', 'degree', 'duration', 'department', 'city', 'state', 'credit', 'toefl', 'description', 'gpa', 'titles', 'payment_type', 'payment_per_unit', 'total_payment', 'living_costs_min', 'living_costs_max']

def getHtmlText(url):
    try:
        r = requests.get(url)
        return r.json()
    except Exception as e:
        print(e)
        return 'Something Wrong!'

def getContent(url):
    html = getHtmlText(url)
    return html

class PaymentType(Enum):
    PAY_BY_CREDIT = 1
    PAY_BY_YEAR = 2
    PAY_BY_FULL = 3
    PAY_BY_SEMESTER = 4
    PAY_BY_MODULE = 5

class Program:
    def __init__(self, name, degree, tuition_fee, duration, department, position):
        self.name = name
        self.degree = degree
        self.duration = int(duration)
        self.department = department
        self.tuition_fee = int(tuition_fee)
        self.city = []
        self.state = []
        self.living_costs_min = []
        self.living_costs_max = []
        for pos in position:
            self.city.append(pos["city"])
            self.state.append(pos["area"])
            self.living_costs_min.append(0)
            self.living_costs_max.append(0)
        self.parse_success = True

    def parse_detailed_content(self, detailed_content):
        try:
            if detailed_content["credits_alternative"] != "":
                self.credit = float(detailed_content["credits_alternative"])
            else:
                self.credit = 0
        except Exception as e:
            print("Error: {} at {}, {}".format(self.name, self.department, e))
            self.parse_success = False

        try:
            if detailed_content["toefl_internet"] != "":
                self.toefl = int(detailed_content["toefl_internet"])
            else:
                self.toefl = 80
        except Exception as e:
            print("Error: {} at {}, {}".format(self.name, self.department, e))

        self.description = detailed_content["description"]

        try:
            if detailed_content["min_gpa"] != "":
                if detailed_content["min_gpa"] in string.ascii_letters:
                    if detailed_content["min_gpa"] == 'B' or detailed_content["min_gpa"] == 'b':
                        self.gpa = 3.0
                    else:
                        print("Error: {} at {} has min_gpa {}".format(self.name, self.department, detailed_content["min_gpa"]))
                else:
                    self.gpa = float(detailed_content["min_gpa"])
            else:
                self.gpa = 3.0
        except Exception as e:
            print("Error: {} at {}, {}".format(self.name, self.department, e))

        self.titles = []
        for discipline in detailed_content["disciplines"].values():
            self.titles.append(discipline["title"])
        self.titles = ','.join(self.titles)

        tuition_fee_types = list(filter(lambda x : x["target"] == "international", detailed_content["tuition_fee_types"]))[0]
        self.payment_per_unit = int(tuition_fee_types["amount"])
        if tuition_fee_types["unit"] == "credit":
            self.payment_type = PaymentType.PAY_BY_CREDIT.value
            self.total_payment = self.credit * self.payment_per_unit
        elif tuition_fee_types["unit"] == "year":
            self.payment_type = PaymentType.PAY_BY_YEAR.value
            self.total_payment = self.duration * self.payment_per_unit / 12
        elif tuition_fee_types["unit"] == "full":
            self.payment_type = PaymentType.PAY_BY_FULL.value
            self.total_payment = self.payment_per_unit
        elif tuition_fee_types["unit"] == "semester":
            self.payment_type = PaymentType.PAY_BY_SEMESTER.value
            self.total_payment = self.duration * self.payment_per_unit * 2 / 12
            if abs(self.total_payment - self.duration * self.tuition_fee / 0.85 / 12) > 100:
                if (self.name == "Cyber Security, Technology and Policy" and self.department == "University of Texas at Dallas"):
                    self.payment_per_unit /= 0.85
                    self.total_payment /= 0.85
                else:
                    print("Error: {} at {} has more than 2 semesters a year with total fees: {} conflicted with {}".format(self.name, self.department, self.total_payment, self.tuition_fee))
        elif tuition_fee_types["unit"] == "module":
            self.payment_type = PaymentType.PAY_BY_MODULE
            if self.department == "University of Pennsylvania":
                self.total_payment = self.payment_per_unit * 10
            elif self.department == "University of Chicago":
                if self.duration == 12:
                    self.total_payment = self.payment_per_unit * 9
                elif self.duration == 18:
                    self.total_payment = self.payment_per_unit * 12
            elif self.department == "Brown University":
                self.total_payment = self.payment_per_unit * 8
            else:
                print("Error: {} at {} has other tuition_fee_types: {}".format(self.name, self.department, tuition_fee_types["unit"]))
                self.parse_success = False
        
        venues = detailed_content["venues"]["full"]
        
        for key in venues.keys():
            city = venues[key]["cities"]
            living = city[list(city.keys())[0]]
            index = self.city.index(living["name"])
            try:
                if living["living_costs_max"] != "":
                    self.living_costs_max[index] = int(living["living_costs_max"])
                    self.living_costs_min[index] = int(living["living_costs_min"])
            except Exception as e:
                print("Error: {} at {}, {}".format(self.name, self.department, e))

def main(base_url, fout):
    writer = csv.writer(fout)
    writer.writerow(header)

    for x in range(1090, 1350, 10):
        print(x)
        url = base_url + str(x) + '&q=ci-82%7Cdg-msc%2Cmeng%7Cde-fulltime%7Cdi-24%7Cdur-%5B360%2C360%5D%2C%5B540%2C540%5D%2C%5B720%2C720%5D%2C%5B721%2C-1%5D%7Cen-4064%7Clv-master%7Cmh-face2face%7Ctc-EUR%7Cuc-133'
        contents = getContent(url)

        for content in contents:
            url0 = base_url0 + str(content["id"]) + '&path=data%2Fstudies%2Fany%2Fdetails%2F'
            # print(content)
            if ("tuition_fee" in content.keys()) != True:
                print("Error: {} at {} do not have tuition&fee info".format(program.name, program.department))
                continue
            program = Program(content["title"], content["degree"], content["tuition_fee"]["value"], content["fulltime_duration"]["value"], content["organisation"], content["venues"])
            if program.parse_success != True:
                continue
            detailed_content = getContent(url0)[str(content["id"])]
            program.parse_detailed_content(detailed_content)
            if program.parse_success != True:
                continue
            for i in range(len(program.city)):
                writer.writerow([program.name, program.degree, program.duration, program.department, program.city[i], program.state[i], program.credit, program.toefl,
             program.description, program.gpa, program.titles, program.payment_type, program.payment_per_unit, program.total_payment,
             program.living_costs_min[i], program.living_costs_max[i]])

if __name__ == '__main__':
    main(base_url, open('src/data/tuition-fee1.csv', 'w', encoding='UTF8'))