from flask import Flask, render_template, request, redirect, url_for, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
import os
import webbrowser

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "templates")
)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(BASE_DIR, "waste.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["UPLOAD_FOLDER"] = os.path.join(BASE_DIR, "uploads")

db = SQLAlchemy(app)


class WasteReport(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    location = db.Column(db.String(200), nullable=False)
    waste_type = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    image = db.Column(db.String(200), nullable=True)
    status = db.Column(db.String(50), default="Reported")


@app.route("/")
def index():
    reports = WasteReport.query.order_by(WasteReport.id.desc()).all()
    return render_template("index.html", reports=reports)


@app.route("/add", methods=["POST"])
def add_report():
    location = request.form["location"]
    waste_type = request.form["wasteType"]
    description = request.form["description"]

    image_file = request.files.get("image")
    filename = ""

    if image_file and image_file.filename != "":
        filename = secure_filename(image_file.filename)
        image_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        image_file.save(image_path)

    new_report = WasteReport(
        location=location,
        waste_type=waste_type,
        description=description,
        image=filename,
        status="Reported"
    )

    db.session.add(new_report)
    db.session.commit()

    return redirect(url_for("index"))


@app.route("/update/<int:id>", methods=["POST"])
def update_status(id):
    report = WasteReport.query.get_or_404(id)
    report.status = request.form["status"]
    db.session.commit()
    return redirect(url_for("index"))


@app.route("/delete/<int:id>")
def delete_report(id):
    report = WasteReport.query.get_or_404(id)

    if report.image:
        image_path = os.path.join(app.config["UPLOAD_FOLDER"], report.image)
        if os.path.exists(image_path):
            os.remove(image_path)

    db.session.delete(report)
    db.session.commit()

    return redirect(url_for("index"))


@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


if __name__ == "__main__":
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    with app.app_context():
        db.create_all()

    webbrowser.open("http://127.0.0.1:5000")
    app.run(debug=True)